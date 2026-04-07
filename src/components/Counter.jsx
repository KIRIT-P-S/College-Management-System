import React from "react";
import { useState } from "react";

function Counter() {
    const [count, setCount] = useState(0);
    return (
        <div>
            <h1>Counter</h1>
            <button>click to increase</button>
        </div>
    )
}