// Get input strings
// 2-way bind inputs
// Parse input strings
// Change css clamp() to provided values in examples

// calculate clamp values for list of checkpoints in px and provide to Chart.js
// when values of inputs change run parse-save and update Chart.js values

const REM = 10;
const LIST_OF_UNITS = ['px', 'rem', 'vw'];
const EXAMPLES = document.querySelectorAll('[data-viewport]');

const createState = (stateObj) => {
    return new Proxy(stateObj, {
        set(target, property, value) {
            target[property] = value;
            render(EXAMPLES);
            return true;
        },
    });
};

const state = createState({
    min: '',
    pref: '',
    max: '',
});

const listeners = document.querySelectorAll('[data-model]');

listeners.forEach((elem) => {
    const name = elem.dataset.model;
    elem.addEventListener('keyup', (event) => {
        state[name] = elem.value;
    });
});

const parseString = (str) => {
    const valuesArr = [];
    str.includes('+')
        ? str.split('+').forEach((el) => valuesArr.push(el))
        : valuesArr.push(str);
    const values = valuesArr.reduce((acc, curr) => {
        let unit = curr
            .replace(/\d+|^\s+|\s+$/g, '')
            .trim()
            .toLowerCase();
        let value = parseFloat(curr);
        if (!LIST_OF_UNITS.includes(unit)) {
            if (unit !== '') {
                console.warn('List: ', LIST_OF_UNITS, 'doesnt include', unit);
            }
            return acc;
        }
        if (acc[unit] !== undefined) {
            acc[unit] = acc[unit] + value;
            return acc;
        }
        if (acc[unit] === undefined) {
            acc[unit] = value;
            return acc;
        }
        console.error('Unable to parse string: ', str);
        return acc;
    }, {});
    return JSON.stringify(values) === JSON.stringify({}) ? undefined : values;
};

const calcAbsoluteFS = (values, viewport) => {
    let fontSize = null;
    if (values.rem) {
        fontSize += values.rem * REM;
    }
    if (values.px) {
        fontSize += values.px;
    }
    if (values.vw) {
        fontSize += (values.vw * viewport) / 100;
    }
    return fontSize;
};

const updateExample = (example, { min, pref, max }) => {
    let calculatedFS = null;
    if (
        parseString(min) === undefined ||
        parseString(pref) === undefined ||
        parseString(max) === undefined
    ) {
        return;
    }

    const calcMin = calcAbsoluteFS(parseString(min), example.dataset.viewport)
    const calcPref = calcAbsoluteFS(parseString(pref), example.dataset.viewport)
    const calcMax = calcAbsoluteFS(parseString(max), example.dataset.viewport)

    if (calcMin < calcPref < calcMax) {
        calculatedFS = calcPref
    }
    if (min > calcPref) {
        calculatedFS = calcMin
    }
    if (calcMax < calcPref) {
        calculatedFS = calcMax
    }

    example.querySelector('.preview__container h3').style.fontSize =
        calculatedFS + 'px';
};

const render = (previews) => {
    previews.forEach(element => {
        updateExample(element, state)
    })
}