import React from 'react';

import StoreContext from './StoreContext';
import MessageList from './MessageList';
import Loading from './Loading';
import Bar from './Bar';

const App = () => (
    <div>
        <React.Timeout>
            {loading => loading
                ? <Loading />
                : <MessageList />
            }
        </React.Timeout>
        <Bar />
    </div>
)

export default App;
