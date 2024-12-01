import moment from 'moment'; //Import moment.js

const timeSince = (timestamp) => {
    const now = moment();
    const then = moment(timestamp);
    const duration = moment.duration(now.diff(then));

    const years = duration.years();
    const months = duration.months();
    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (years) {
        return `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (months) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (days) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds) {
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
};


export default timeSince;