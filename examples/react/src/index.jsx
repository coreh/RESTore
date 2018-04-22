import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';

import StoreContext from './StoreContext';
import App from './App';
import store from './store';

const wrapper = document.getElementById('wrapper');

function render() {
    ReactDOM.render(
        <React.unstable_AsyncMode>
            <StoreContext.Provider value={store} >
                <App />
            </StoreContext.Provider>
        </React.unstable_AsyncMode>,
        wrapper,
    );
}

store.subscribe(render);

render();
