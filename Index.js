const display = document.getElementById('display');

function appendToDisplay(input) {
    display.value += input;
}

function clearDisplay() {
    display.value = "";
}

function deleteLast() {
    display.value = display.value.slice(0, -1);
}

// attach behavior to clear button: click deletes last char; long-press clears all
window.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clearBtn');
    if (!clearBtn) return;
    let timer = null;
    const longPressDuration = 500; // ms

    const start = (evt) => {
        // start timer to clear all
        timer = setTimeout(() => {
            clearDisplay();
            timer = null;
        }, longPressDuration);
    };

    const end = (evt) => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            // treat as single click: delete last char
            deleteLast();
        }
        // prevent default mouseup on touch
    };

    clearBtn.addEventListener('mousedown', start);
    clearBtn.addEventListener('touchstart', start);
    clearBtn.addEventListener('mouseup', end);
    clearBtn.addEventListener('mouseleave', () => { if (timer) { clearTimeout(timer); timer = null; } });
    clearBtn.addEventListener('touchend', end);
});

// safer evaluate: only allow digits, operators, parentheses, dot and the √ symbol
function safeEval(expr) {
    if (!/^[0-9+\-*/().\s√]+$/.test(expr)) throw new Error('Invalid characters');
    // auto-close parentheses if user left them open
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    if (openCount > closeCount) expr = expr + ')'.repeat(openCount - closeCount);
    // replace √ with Math.sqrt before evaluation
    const sanitized = expr.replace(/√/g, 'Math.sqrt');
    // eslint-disable-next-line no-eval
    return eval(sanitized);
}

function calculate() {
    try {
        const result = safeEval(display.value || '0');
        display.value = String(result);
    }
    catch (error) {
        display.value = "Error";
    }
}

function sqrtDisplay() {
    // append the square-root symbol and an opening parenthesis so the expression
    // is evaluated only when user presses '='
    appendToDisplay('√( )');
}

// convert decimal to fraction using continued fraction algorithm
function toFraction(maxDenominator = 10000) {
    try {
        const x = parseFloat(display.value);
        if (isNaN(x)) {
            display.value = 'Error';
            return;
        }
        const sign = x < 0 ? -1 : 1;
        let a = Math.abs(x);
        if (Number.isInteger(a)) {
            display.value = (sign * a).toString() + '/1';
            return;
        }

        let bestNum = 1, bestDen = 1, bestErr = Math.abs(a - bestNum / bestDen);
        let lower_n = 0, lower_d = 1;
        let upper_n = 1, upper_d = 0;
        while (true) {
            const mediant_n = lower_n + upper_n;
            const mediant_d = lower_d + upper_d;
            if (mediant_d > maxDenominator) break;
            if (a * mediant_d > mediant_n) {
                lower_n = mediant_n; lower_d = mediant_d;
            } else {
                upper_n = mediant_n; upper_d = mediant_d;
            }
            const mediant = mediant_n / mediant_d;
            const err = Math.abs(a - mediant);
            if (err < bestErr) {
                bestErr = err; bestNum = mediant_n; bestDen = mediant_d;
            }
        }
        // also check closest continued fraction endpoints
        const candidates = [
            {n: Math.round(a * maxDenominator), d: maxDenominator},
            {n: lower_n, d: lower_d},
            {n: upper_n, d: upper_d},
            {n: bestNum, d: bestDen}
        ];
        let finalN = 1, finalD = 1, finalErr = Infinity;
        for (const c of candidates) {
            if (c.d === 0) continue;
            const valc = c.n / c.d;
            const err = Math.abs(a - valc);
            if (err < finalErr) {
                finalErr = err; finalN = c.n; finalD = c.d;
            }
        }
        // reduce fraction
        const g = gcd(finalN, finalD);
        finalN = finalN / g;
        finalD = finalD / g;
        if (finalD === 1) display.value = (sign * finalN).toString() + '/1';
        else display.value = (sign * finalN) + '/' + finalD;
    } catch (e) {
        display.value = 'Error';
    }
}

function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) {
        const t = a % b; a = b; b = t;
    }
    return a;
}
