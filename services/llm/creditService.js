const { setTimeout } = require('timers/promises');

async function run(applicationId) {
    // TODO: check on data needed to return
    data = {
        score: 720
    }

    const result = await setTimeout(2000, 'resolved');
    return result == 'resolved' ? data : null;
}

module.exports = { run }