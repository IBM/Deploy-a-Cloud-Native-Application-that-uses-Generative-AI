const { setTimeout }  = require('timers/promises');

async function run(applicationId) {
    const VIOLATIONS = [
        "speeding",
        "reckless_driving",
        "failure_to_stop",
        "driving_under_influence",
        "no_valid_license",
        "no_insurance",
        "expired_registration",
        "improper_lane_change",
        "running_red_light",
        "distracted_driving"
    ]
    
    const shuffle = ([...arr]) => {
        let m = arr.length;
        while (m) {
          const i = Math.floor(Math.random() * m--);
          [arr[m], arr[i]] = [arr[i], arr[m]];
        }
        return arr;
      };
    const sample = ([...arr], n = 1) => shuffle(arr).slice(0, n);

    const num_violations = Math.floor(Math.random() * 4);
    let violations = sample(VIOLATIONS, num_violations);
    if (violations.length == 0)
        violations = ["none"]

    data = {
        "license_status": (Math.random() >= 0.5) ? "full_license" : "learners_permit",
        "violations": violations,
    }

    const result = await setTimeout(2000, 'resolved');
    return result == 'resolved' ? data : null;
    
}

module.exports = { run }