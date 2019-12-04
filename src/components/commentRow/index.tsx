import { h } from 'preact'
import { RedditComment } from '../common'
import { commentBody, commentMetadata, commentRowCard } from './style.css'

const CommentRow = (comment: RedditComment) => {
    return (
        <a className={commentRowCard} href={comment.href.href} target="_blank" rel="noopener noreferrer">
            <span className={commentMetadata}>on /r/{comment.subreddit} by /u/{comment.author}:</span>
            <span className={commentBody}>{comment.body}</span>
        </a>
    )
}

export default CommentRow