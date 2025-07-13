// Collection of functuions aiming to resolve chemical problems
let elements = {"Al": [26.98, 3], "Li": [6.94, 1], "Fe": [55.85, 2], "Zr": [91.22, 4], "Zn": [65.38, 2]};

function fractionWeight(percentage, grams) {
    if (percentage < 0 || percentage > 100 || grams < 0) {
        throw new Error("Percentage must be between 0 and 100, and grams must be >= 0");
    }
    return (percentage / 100) * grams;
}

function GasGenerated(weight, temp, press, el) {
    if (weight <= 0) {
        throw new Error("Weight must be greater than 0");
    }
    const MW = elements[el][0]; // g/mol
    const valence = elements[el][1]; // valence
    const MWHydrogen = 2.0; // conversion factor for lithium to hydrogen gas
    const gasConstant = 8.314; // J/K⋅mol
    temp = temp + 273.15; // Convert Celsius to Kelvin
    const gasGenerated = (weight * valence/ (MW * MWHydrogen)) * gasConstant * (temp / press); // Ideal gas law
    return gasGenerated;
}

function wrapper(percentage, grams, temp, press, elem) {
    try {
        const weight = fractionWeight(percentage, grams);
        const gas = GasGenerated(weight, temp, press, elem);
        console.log(`The weight of lithium is ${weight} grams.`);
        return gas;
    } catch (error) {
        console.error(error.message);
    }
}


