import { h } from 'preact'
import { Pause, Play } from 'preact-feather'
import { useEffect, useState } from 'preact/hooks'
import { CommentsChunk, getComments } from '../common'
import { getCommentsButton } from './style.css'

const GetCommentsButton: preact.FunctionalComponent<{
    newCommentsHandler: (chunk: CommentsChunk) => Promise<string>,
    clickHandler: () => void
}> = ({ newCommentsHandler, clickHandler }) => {

    const [cursor, setCursor] = useState('')
    const [gettingComments, setGettingComments] = useState(false)
    const [numFetches, setNumFetches] = useState(0)

    const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const getCommentsAndUpdateCursor = () => {

        if (!gettingComments) {
            return
        }
        getComments(cursor).then(newCommentsHandler).then(setCursor)
    }

    const incrementNumFetchesAfterDelay = () => {

        if (!gettingComments) {
            return
        }
        sleep(1000).then(() => setNumFetches(prev => prev + 1))
    }

    // Fetch more comments every time numFetches changes
    useEffect(getCommentsAndUpdateCursor, [numFetches])

    // increment numFetches when numFetches changes (interval timer), or when gettingComments changes
    useEffect(incrementNumFetchesAfterDelay, [numFetches, gettingComments])

    const onClick = () => {
        setGettingComments(wasGettingComments => !wasGettingComments)
        clickHandler()
    }

    return (
        <button className={getCommentsButton} onClick={onClick}>
            {gettingComments ? <Pause /> : <Play />} {gettingComments ? ' Stop' : ' Start'}
        </button>
    )

}

export default GetCommentsButton