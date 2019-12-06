import { h } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { CommentLink, CommentNode, CommentsChunk, RedditComment, SubredditJsonResponse } from './common'
import GetCommentsButton from './getCommentsButton'
import Intro from './intro'
import { visualizationWrapper } from './style.css'
import Visualization from './visualization'

const App: preact.FunctionalComponent = () => {

    const colors: { [subreddit: string]: string } = {}

    const [nodes, updateNodes] = useState<CommentNode[]>([])
    const [links, updateLinks] = useState<CommentLink[]>([])
    const [shouldRender, updateShouldRender] = useState<boolean>(false)
    const wrapper = useRef<HTMLDivElement>()

    const newCommentsHandler = async (newCommentsChunk: CommentsChunk): Promise<string> => {

        const { cursor, comments } = newCommentsChunk

        Promise.all(comments.map(createNode))
            .then(newNodes => {
                updateLinks(prevLinks => [...prevLinks,
                ...newNodes.map(d => {
                    const sameSub = nodes.find(n => d.data.subreddit === n.data.subreddit)
                    return sameSub ? new CommentLink(sameSub, d) : undefined
                })
                    .filter(d => d !== undefined) as CommentLink[]
                ])
                updateNodes(prevNodes => [...prevNodes, ...newNodes])
            })

        return cursor

    }

    const newNodeCoords = (subreddit: string): { x: number, y: number } => {

        if (!wrapper.current) {
            throw new Error('Wrapper div is undefined!')
        }

        const subNodes = nodes.filter(d => d.data.subreddit === subreddit)

        if (subNodes.length === 0) {
            const radialOffset = Math.random() * Math.PI * 2
            const offsetMultiplier = 1000
            const x = Math.round(wrapper.current.clientWidth / 2 + offsetMultiplier * Math.cos(radialOffset))
            const y = Math.round(wrapper.current.clientHeight / 2 + offsetMultiplier * Math.sin(radialOffset))
            return { x, y }
        }

        return (
            subNodes
                .map(({ x, y }) => ({ x, y }))
                .reduce((a, b, i) => ({
                    x: (a.x * i + b.x) / (i + 1),
                    y: (a.y * i + b.y) / (i + 1)
                }), { x: 0, y: 0 }))
    }

    const createNode = async (comment: RedditComment): Promise<CommentNode> => {

        let color: string

        if (colors[comment.subreddit]) {
            color = colors[comment.subreddit]
        } else {
            color = await fetch('https://www.reddit.com/r/' + comment.subreddit + '/about.json')
                .then(res => res.json() as Promise<SubredditJsonResponse>)
                .then(json => json.data.primary_color)
        }

        if (!color) {
            color = '#d3d3d3' // lol get it because we're using D3 but also this is a nice neutral gray
        }

        const { x, y } = newNodeCoords(comment.subreddit)

        return new CommentNode(comment, x, y, color)
    }

    return (
        <div className={visualizationWrapper} ref={wrapper}>
            {nodes.length === 0 ? <Intro /> : <Visualization nodes={nodes} links={links} wrapper={wrapper.current} shouldRender={shouldRender} />}
            <GetCommentsButton
                newCommentsHandler={newCommentsHandler}
                clickHandler={() => updateShouldRender(prev => !prev)}
            />
        </div>
    )
}

export default App