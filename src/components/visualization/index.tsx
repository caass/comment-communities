import { forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation, forceX, forceY } from 'd3-force'
import { timer } from 'd3-timer';
import { h } from 'preact';
import { useRef } from 'preact/hooks'
import { CommentLink, CommentNode } from '../common';

const Visualization: preact.FunctionalComponent<{
    nodes: CommentNode[],
    links: CommentLink[],
    wrapper: HTMLDivElement | undefined,
    shouldRender: boolean
}> = ({ nodes, links, wrapper, shouldRender }) => {

    if (wrapper === undefined) {
        throw new Error('Wrapper must not be undefined!')
    }

    const canvas = useRef<HTMLCanvasElement>()
    const NODE_RADIUS = 8

    const simulation = forceSimulation<CommentNode, CommentLink>(nodes)
        .force('collide', forceCollide<CommentNode>()
            .radius(1.5 * NODE_RADIUS)
            .strength(0.7))
        .force('charge', forceManyBody<CommentNode>()
            .distanceMax(100)
            .strength(-20)
            .theta(0.5))
        .force('link', forceLink<CommentNode, CommentLink>(links)
            .id(d => d.data.id)
            .strength(0.2))
        .force('radial', forceRadial<CommentNode>(
            (d, i, data) => Math.sqrt(data.length) * 1.4 * NODE_RADIUS,
            Math.round(wrapper.clientWidth / 2),
            Math.round(wrapper.clientHeight / 2))
            .strength((d, i, data) => (
                Math.sqrt(data.filter(n => n.data.subreddit === d.data.subreddit).length) * 0.01
            )))
        .force('x', forceX<CommentNode>(Math.round(wrapper.clientWidth / 2))
            .strength(0.05))
        .force('y', forceY<CommentNode>(Math.round(wrapper.clientHeight / 2))
            .strength(0.05))
        .alphaTarget(0.4)

    timer(() => {
        if (!canvas.current || !shouldRender) {
            return
        }

        const ctx = canvas.current.getContext('2d')

        if (!ctx) {
            return
        }

        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)

        simulation.nodes().forEach(d => {
            ctx.fillStyle = d.color
            ctx.beginPath()
            ctx.arc(d.x, d.y, NODE_RADIUS, 0, 2 * Math.PI)
            ctx.fill()
        })
    })

    return (
        <canvas width={wrapper.clientWidth} height={wrapper.clientHeight} ref={canvas} />
    )
}

export default Visualization