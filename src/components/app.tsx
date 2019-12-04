import { h } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { CommentNode, CommentsChunk, RedditComment, SubredditJsonResponse } from './common'
import GetCommentsButton from './getCommentsButton'
import Intro from './intro'
import { visualizationWrapper } from './style.css'
import Visualization from './visualization'

const App: preact.FunctionalComponent = () => {

    const colors: { [subreddit: string]: string } = {}
    let clicked = false

    const [nodes, updateNodes] = useState<CommentNode[]>([])
    const wrapper = useRef<HTMLDivElement>()

    const newCommentsHandler = async (newCommentsChunk: CommentsChunk): Promise<string> => {

        const { cursor, comments: newComments } = newCommentsChunk

        Promise.all(newComments.map(createNode))
            .then(newNodes => updateNodes(prevNodes => [...prevNodes, ...newNodes]))

        return cursor

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
            color = '#d3d3d3' // lol
        }

        return new CommentNode(comment, NaN, NaN, color)
    }

    return (
        <div className={'container ' + (!clicked || !wrapper.current ? '' : visualizationWrapper)} ref={wrapper}>
            {!clicked || !wrapper.current ? <Intro /> : <Visualization nodes={nodes} wrapper={wrapper.current} />}
            <GetCommentsButton
                newCommentsHandler={newCommentsHandler}
                clickHandler={() => clicked = true}
            />
        </div>
    )
}

export default App