import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks'
import { CommentNode } from '../common';

const Visualization: preact.FunctionalComponent<{ nodes: CommentNode[], wrapper: HTMLDivElement | undefined }> = ({ nodes, wrapper }) => {

    if (wrapper === undefined) {
        throw new Error('Wrapper must not be undefined!')
    }

    const canvas = useRef<HTMLCanvasElement>()

    useEffect(() => { console.log(nodes) }, [nodes])

    return (
        <canvas width={wrapper.clientWidth} height={wrapper.clientHeight} ref={canvas} />
    )
}

export default Visualization