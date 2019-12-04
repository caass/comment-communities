import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force'
import { timer } from 'd3-timer';
import { h } from 'preact';
import { useRef } from 'preact/hooks'
import { CommentNode } from '../common';

const Visualization: preact.FunctionalComponent<{ nodes: CommentNode[], wrapper: HTMLDivElement }> = ({ nodes, wrapper }) => {

    const NODE_RADIUS = 10
    const canvasRef = useRef<HTMLCanvasElement>()

    const clusterCenters: { [subreddit: string]: { x: number, y: number } } = {}

    const clusterCenter = (subreddit: string): { x: number, y: number } => {
        if (clusterCenters[subreddit]) {
            return clusterCenters[subreddit]
        }

        return { x: 420, y: 420 }
    }

    const simulation = forceSimulation<CommentNode>(nodes)
        .force('collide', forceCollide<CommentNode>()
            .radius(1.2 * NODE_RADIUS)
            .strength(0.8))
        .force('x', forceX<CommentNode>(() => canvasRef.current ? Math.round(canvasRef.current.width / 2) : 420)
            .strength(0.1))
        .force('y', forceY<CommentNode>(() => canvasRef.current ? Math.round(canvasRef.current.height / 2) : 420)
            .strength(0.1))
        .force('cluster-x', forceX<CommentNode>(d => clusterCenter(d.data.subreddit).x)
            .strength(d => 0.01 * Math.abs(d.x - clusterCenter(d.data.subreddit).x)))
        .force('cluster-y', forceY<CommentNode>(d => clusterCenter(d.data.subreddit).y)
            .strength(d => 0.01 * Math.abs(d.y - clusterCenter(d.data.subreddit).y)))
        .alphaTarget(0.4)
        .on('tick.updateClusterCenters', () => {
            const subreddits: string[] = nodes.map(d => d.data.subreddit).filter((sub, i, a) => a.indexOf(sub) === i)
            subreddits.forEach(s => {

                const { x, y } = nodes
                    .filter(d => d.data.subreddit === s)
                    .map(d => ({ x: d.x, y: d.y }))
                    .reduce((a, b, i) => ({
                        x: (a.x * i + b.x) / (i + 1),
                        y: (a.y * i + b.y) / (i + 1)
                    }), { x: 0, y: 0 })

                clusterCenters[s] = { x, y }
            })
        })

    timer(() => {

        if (canvasRef.current === undefined) {
            return
        }

        const ctx = canvasRef.current.getContext('2d')

        if (ctx === null) {
            return
        }

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

        nodes.forEach(d => {
            ctx.fillStyle = d.color
            ctx.beginPath()
            ctx.arc(d.x, d.y, NODE_RADIUS, 0, 2 * Math.PI)
            ctx.fill()
        })

        simulation.restart()

    })

    return (
        <canvas width={wrapper.clientWidth} height={wrapper.clientHeight} ref={canvasRef} />
    )
}

export default Visualization