// Example feature module
// This file demonstrates a feature structure

import { useState } from 'react';

export const useCounter = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return { count, increment, decrement, reset };
};

// Example feature component
export const CounterFeature = () => {
  const { count, increment, decrement, reset } = useCounter();

  return (
    <div>
      <h2>Counter Feature</h2>
      <p>Count: { count }</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};