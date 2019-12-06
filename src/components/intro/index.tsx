import { h } from 'preact'
import { title } from './style.css'

const Intro: preact.FunctionalComponent = () => {
    return (
        <div className='container'>
            <div className="row">
                <div className="twelve columns">
                    <h1 className={title}>Comment Communities</h1>
                    <h4>A look at the comment activity happening on reddit, right now.</h4>
                </div>
                <div className="twelve columns">
                    <p>reddit dot com is a place where people can share all sorts of content related to all sorts of interests. These interests are grouped into sub-reddits, and each sub has its own particular interest that it caters to. <a href="https://reddit.com/r/politics" target="_blank" rel="noopener noreferrer">/r/politics</a>, for example, is about politics. <a href="https://reddit.com/r/aww" target="_blank" rel="noopener noreferrer">/r/aww</a>, on the other hand, is about cute animals.</p>
                    <p>Every time someone shares a post, everyone else can comment on that post. If it's in <a href="https://reddit.com/r/politics" target="_blank" rel="noopener noreferrer">/r/politics</a>, you might see constructive political discourse like "Hmm, while I agree with the sentiment behind the policy, I don't believe that this is the best way to go about enacting the target change." On <a href="https://reddit.com/r/aww" target="_blank" rel="noopener noreferrer">/r/aww</a>, you might just get an outpouring of "How cute! 😻😻😻"</p>
                    <p>By looking at all the new comments coming in and grouping them into their respective subreddits, we can visualize where the most activity is happening on reddit, right now, in real time. Click the button on the left to start getting new comments, and poke around to see where the action is.</p>
                </div>
            </div>
        </div>
    )
}

export default Intro