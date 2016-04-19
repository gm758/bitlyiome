import { run } from '@cycle/core';
import { makeDOMDriver, h1, div, input, label, hr, ul, li, a, aside } from '@cycle/dom';
import { Observable } from 'rx';
import leftpad from 'left-pad';

const REFERENCE_HREFS = {
  AND: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Bitwise_AND',
  OR: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Bitwise_OR',
  XOR: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Bitwise_XOR',
  NOT: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Bitwise_NOT',
  LEFT_SHIFT: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Left_shift',
  SIGN_RIGHT_SHIFT: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Right_shift',
  ZERO_RIGHT_SHIFT: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Unsigned_right_shift',
};

function intent(DOM) {
  return {
    base2Input$: DOM.select('.base2Input').events('input')
      .map(ev => ev.target.value),
    base10Input$: DOM.select('.base10Input').events('input')
      .map(ev => ev.target.value),
    expressionInput$: DOM.select('.expression').events('input')
      .map(ev => ev.target.value),
    evalClick$: DOM.select('.evaluate').events('click'),
    tabHover$: DOM.select('.definitions').events('mouseenter'),
    tabLeave$: DOM.select('.definitions').events('mouseleave')
      .filter(e => e.target === e.ownerTarget),
  };
}

function model({ base2Input$, base10Input$, expressionInput$, evalClick$, tabHover$, tabLeave$ }) {
  const base10Value$ = base2Input$
    .startWith(0)
    .withLatestFrom(base10Input$.startWith(0), (base2, base10) => ({
      base10Value: parseInt(base2, 2),
      base2Value: base2,
    }));

  const base2Value$ = base10Input$
    .startWith(0)
    .withLatestFrom(base2Input$.startWith(0), (base10, base2) => ({
      base10Value: base10,
      base2Value: parseInt(base10, 10).toString(2),
    }));

  const evaluation$ = evalClick$
    .withLatestFrom(expressionInput$, (click, expression) => expression)
    .map(expression => expression
        .split('')
        .reduce((acc, curr) => {
          if (+curr === +curr) { // !NaN
            acc.numbers[acc.numbers.length-1] += curr
          } else {
            acc.operations.push(curr);
            acc.numbers.push('');
          }
          return acc;
        }, { numbers: [''], operations: [] })
    );

  const menu$ = tabHover$
    .merge(tabLeave$)
    .map(e => e.type === 'mouseenter')
    .startWith(false);

  // TODO: use cb to turn state into object
  return {
    state$: base10Value$.merge(base2Value$).combineLatest(menu$),
  };
}

function view({ state$ }) {
  const evalView = div([
    label('Expression: '),
    input('.expression', { type: 'text', value: '' }),
    input('.evaluate', { type: 'button', value: 'Eval' })
  ]);

  const inputView$ = state$.map(([{ base2Value,  base10Value}, hover]) =>
    div([
      label('Base 10 Value: '),
      input('.base10Input', { type: 'text', value: base10Value }),
      label('Binary Value: '),
      input('.base2Input', { type: 'text', value: base2Value }),
      hr(),
      evalView,
      aside('.wrapper', [
        div('.definitions', {style: `margin-left: ${hover ? '0' : '90'}%`}, [
          ul([
            li(a({ href: REFERENCE_HREFS['AND'], target: "_blank" }, '&  : AND')),
            li(a({ href: REFERENCE_HREFS['OR'], target: "_blank" }, '|  : OR')),
            li(a({ href: REFERENCE_HREFS['XOR'], target: "_blank" }, '^  : XOR')),
            li(a({ href: REFERENCE_HREFS['NOT'], target: "_blank" }, '~  : NOT')),
            li(a({ href: REFERENCE_HREFS['LEFT_SHIFT'], target: "_blank" }, '<< : Left Shift')),
            li(a({ href: REFERENCE_HREFS['SIGN_RIGHT_SHIFT'], target: "_blank" }, '>> : Sign-propagating right shift')),
            li(a({ href: REFERENCE_HREFS['ZERO_RIGHT_SHIFT'], target: "_blank" }, '>>>: Zero-fill right Shift')),
          ])
        ])
      ])
    ])
  );

  return inputView$;
}

function main({ DOM }) {
  const actions = intent(DOM);
  const state$ = model(actions);
  return {
    DOM: view(state$)
  };
}

const drivers = {
  DOM: makeDOMDriver(document.querySelector('.app')),
};

run(main, drivers);

function isBinary(str) {
  return /^[0-1]*$/.test(str);
}

function isNumber(str) {
  return /^[0-9]*$/.test(str);
}
