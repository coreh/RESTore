const latency = () => (
    new Promise(resolve => {
        setTimeout(resolve, 500 + Math.random() * 500)
    })
);

export default latency;
