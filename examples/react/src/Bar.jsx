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

    handleSend = () => {
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
                <input placeholder="Message" type="text" value={this.state.value} onChange={this.handleChange} />
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
