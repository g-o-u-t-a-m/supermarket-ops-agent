function calculateGST(taxableAmount, gstRate) {
    const totalTax = Math.round(
        taxableAmount * gstRate / 100
    );

    const cgst = Math.floor(totalTax / 2);
    const sgst = totalTax - cgst;

    return {
        taxableAmount,
        totalTax,
        cgst,
        sgst
    };
}

module.exports = {
    calculateGST
};