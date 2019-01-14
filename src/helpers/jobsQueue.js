const jobsQueue = {

    jobs: {},

    register(name, job, time) {
        if (this.jobs[name]) {
            throw new Error(`Synchronous job ${name} already registered`);
        }

        const nextJob = function () {
            return job(() => {
                jobsQueue.jobs[name] = setTimeout(nextJob, time);
            });
        };

        nextJob();
        return this.jobs[name];
    }

};

module.exports = jobsQueue;

/** ************************************* END OF FILE ************************************ */
