import React from 'react';

import StoreContext from './StoreContext';

const Message = (props) => (
    <StoreContext.Consumer>
        {store => {
            // Calling .take() instead of .get() here throws a Promise,
            // causing the React rendering to suspend and resume at a
            // later time when the resource becomes available
            const message = store.take(props.path);
            return <li className={message.state}>{message.message}</li>;
        }}
    </StoreContext.Consumer>
);

export default Message;
