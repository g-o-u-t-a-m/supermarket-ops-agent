function rupeesToPaise(value) {
    return Math.round(Number(value) * 100);
}

function paiseToRupees(value) {
    return (Number(value) / 100).toFixed(2);
}

function formatINR(paise) {
    return `₹${paiseToRupees(paise)}`;
}

module.exports = {
    rupeesToPaise,
    paiseToRupees,
    formatINR
};