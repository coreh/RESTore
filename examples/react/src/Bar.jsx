import React from 'react';

import StoreContext from './StoreContext';

class BarRaw extends React.Component {
    constructor() {
        super();
        this.state = {
            value: '',
        };
    }

    handleChange = (e) => {
        this.setState({
            value: e.target.value,
        });
    }

    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            return this.handleSend();
        }
    }

    handleSend = () => {
        if (this.state.value === '') {
            return;
        }

        this.props.store.post('/messages', {
            message: this.state.value
        });

        this.setState({
            value: '',
        });
    }

    render() {
        return (
            <div className="bar">
                <input autoFocus placeholder="Message" type="text" value={this.state.value} onKeyPress={this.handleKeyPress} onChange={this.handleChange} />
                <button onClick={this.handleSend}>Send</button>
            </div>
        );
    }
}

const Bar = () => (
    <StoreContext.Consumer>
        {store => <BarRaw store={store} />}
    </StoreContext.Consumer>
);

export default Bar;
