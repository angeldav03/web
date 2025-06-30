// Collection of functuions aiming to resolve chemical problems

function fractionWeight(percentage, grams) {
    if (percentage < 0 || percentage > 100 || grams < 0) {
        throw new Error("Percentage must be between 0 and 100, and grams must be >= 0");
    }
    return (percentage / 100) * grams;
}

function lithiumGasGenerated(weight, temp, press) {
    if (weight <= 0) {
        throw new Error("Weight must be greater than 0");
    }
    const MWLithium = 6.94; // g/mol
    const MWHydrogen = 2.0; // conversion factor for lithium to hydrogen gas
    const gasConstant = 8.314; // J/K⋅mol
    temp = temp + 273.15; // Convert Celsius to Kelvin
    const gasGenerated = (weight / (MWLithium * MWHydrogen)) * gasConstant * (temp / press); // Ideal gas law
    return gasGenerated;
}

function wrapper(percentage, grams, temp, press) {
    try {
        const weight = fractionWeight(percentage, grams);
        const gas = lithiumGasGenerated(weight, temp, press);
        console.log(`The weight of lithium is ${weight} grams.`);
        return gas;
    } catch (error) {
        console.error(error.message);
    }
}

function fib(n){
    // if(n == 0) return 0;
    if(n <= 1) return n;
    else return fib(n - 1) + fib(n - 2);
}
