import React from 'react';

import StoreContext from './StoreContext';
import Message from './Message';

const MessageList = (props) => (
    <StoreContext.Consumer>
        {store => (
            <ul className="messages">
                {store.take('/messages').map(path => <Message key={path} path={path} />)}
            </ul>
        )}
    </StoreContext.Consumer>
)

export default MessageList;
