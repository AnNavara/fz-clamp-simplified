// Get input strings
// 2-way bind inputs
// Parse input strings
// Change css clamp() to provided values in examples

// calculate clamp values for list of checkpoints in px and provide to Chart.js
// when values of inputs change run parse-save and update Chart.js values

const REM = 10;
const LIST_OF_UNITS = ['px', 'rem', 'vw'];
const LIST_OF_VIEWPORTS = [
    180, 220, 320, 360, 380, 410, 540, 768, 820, 1024, 1280, 1360, 1530,
];
const EXAMPLES = document.querySelectorAll('[data-viewport]');
const canvas = document.querySelector('[data-chart]').getContext('2d');

const createState = (stateObj) => {
    return new Proxy(stateObj, {
        set(target, property, value) {
            target[property] = value;
            render(EXAMPLES);
            saveState(state);
            return true;
        },
    });
};

const state = createState({
    min: '',
    pref: '',
    max: '',
});

const saveState = (state) => {
    localStorage.setItem('state', JSON.stringify(state));
};

const listeners = document.querySelectorAll('[data-model]');

const loadState = (inputs) => {
    if (!localStorage.getItem) {
        return;
    }
    const oldState = JSON.parse(localStorage.getItem('state'));
    for (key in oldState) {
        if (key in state) state[key] = oldState[key];
    }
    inputs.forEach((el) => {
        for (key in oldState) {
            if (key === el.dataset.model) {
                el.value = oldState[key];
            }
        }
    });
};

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
            .replace(/\.|\d+|^\s+|\s+$/g, '')
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

const validateData = ({ min, pref, max }) => {
    if (
        parseString(min) === undefined ||
        parseString(pref) === undefined ||
        parseString(max) === undefined
    ) {
        return false;
    } else {
        return true;
    }
};

const getValidFS = (viewport, { min, pref, max }) => {
    let calculatedFS = null;
    const calcMin = calcAbsoluteFS(parseString(min), viewport);
    const calcPref = calcAbsoluteFS(parseString(pref), viewport);
    const calcMax = calcAbsoluteFS(parseString(max), viewport);
    if (calcMin < calcPref < calcMax) {
        calculatedFS = calcPref;
    }
    if (calcMin > calcPref) {
        calculatedFS = calcMin;
    }
    if (calcMax < calcPref) {
        calculatedFS = calcMax;
    }
    return calculatedFS;
};

const updateExample = (example, data) => {
    if (!validateData(data)) {
        return;
    }
    example.querySelector('.preview__container h3').style.fontSize =
        getValidFS(example.dataset.viewport, data) + 'px';
};

const calcChartFS = (data) => {
    if (!validateData(data)) {
        return [];
    }
    const dataViewports = LIST_OF_VIEWPORTS.map((viewport) => {
        return getValidFS(viewport, data);
    });
    return dataViewports;
};

const chart = new Chart(canvas, {
    type: 'line',
    data: {
        labels: LIST_OF_VIEWPORTS,
        datasets: [
            {
                label: 'font size px',
                data: calcChartFS(state),
                borderWidth: 2,
            },
        ],
    },
    options: {
        responsive: true,
        scales: {
            y: {
                title: 'fz in px',
                display: true
            },
            x: {
                title: 'viewport width',
                display: true
            }
        },
        elements: {
            line: {
                tension: 0.15,
                borderColor: 'rgba(41, 41, 41, 0.68)',
            },
        },
    },
});

const render = (previews) => {
    previews.forEach((element) => {
        updateExample(element, state);
    });
    chart.data.datasets[0].data = calcChartFS(state);
    chart.update();
};

loadState(listeners);