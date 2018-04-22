import React from 'react';

import StoreContext from './StoreContext';

const Message = (props) => (
    <StoreContext.Consumer>
        {store => {
            const message = store.take(props.path);
            return <li className={message.state}>{message.message}</li>;
        }}
    </StoreContext.Consumer>
);

export default Message;
