'use strict';

// ── Typewriter Queue & Scheduler State ───────────────────────
let printQueue = [];
let isPrinting = false;
let isProcessingScheduled = false;
let timerId = null;
let currentLineElement = null;
let currentLineText = "";
let currentLineType = "";
let currentLinePos = 0;
let charsPerTick = 1;

// ── Terminal Printing Helper ─────────────────────────────────
export function printLine(text, type = '', delay = -1) {
    printQueue.push({ text, type, delay });
    if (!isPrinting && !isProcessingScheduled) {
        isProcessingScheduled = true;
        queueMicrotask(() => {
            isProcessingScheduled = false;
            processQueue();
        });
    }
}

export function clearTerminal() {
    printQueue = [];
    isPrinting = false;
    isProcessingScheduled = false;
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    currentLineElement = null;
    currentLineText = "";
    currentLinePos = 0;
    const output = document.getElementById('story-terminal-output');
    if (output) output.innerHTML = '';
}

function processQueue() {
    if (isPrinting) return;
    if (printQueue.length === 0) return;

    isPrinting = true;

    // Calculate total character length in the queue
    const totalLength = printQueue.reduce((sum, item) => sum + (item.text ? item.text.length : 0), 0);
    
    // Target completion in ~1.2 to 1.5 seconds.
    // Running at ~60fps (16ms ticks), 1.3 seconds is about 80 ticks.
    const targetTicks = 80;
    charsPerTick = Math.ceil(totalLength / targetTicks);
    if (charsPerTick < 1) charsPerTick = 1;

    // Start scheduler
    timerId = setInterval(tick, 16);
}

function tick() {
    const output = document.getElementById('story-terminal-output');
    if (!output) {
        stopPrinting();
        return;
    }

    let budget = charsPerTick;

    while (budget > 0) {
        // Fetch next line from queue if none active
        if (currentLineElement === null) {
            if (printQueue.length === 0) {
                stopPrinting();
                return;
            }

            const next = printQueue.shift();
            currentLineText = next.text || "";
            currentLineType = next.type;
            currentLinePos = 0;

            // Create line container
            currentLineElement = document.createElement('div');
            currentLineElement.className = 'mono text-xs leading-relaxed py-0.5';
            
            if (currentLineType === 'ok') {
                currentLineElement.style.color = '#10b981';
            } else if (currentLineType === 'err') {
                currentLineElement.style.color = '#ef4444';
            } else if (currentLineType === 'warn') {
                currentLineElement.style.color = '#eab308';
            } else if (currentLineType === 'sys') {
                currentLineElement.style.color = '#a855f7';
            } else {
                currentLineElement.style.color = '#38bdf8';
            }

            output.appendChild(currentLineElement);
            output.scrollTop = output.scrollHeight;

            // Immediate printing if delay is explicitly 0
            if (next.delay === 0) {
                currentLineElement.textContent = currentLineText;
                currentLineElement = null;
                output.scrollTop = output.scrollHeight;
                continue;
            }
        }

        // Stream chars up to the tick budget
        const remainingChars = currentLineText.length - currentLinePos;
        const toPrint = Math.min(budget, remainingChars);

        if (toPrint > 0) {
            currentLineElement.textContent += currentLineText.substring(currentLinePos, currentLinePos + toPrint);
            currentLinePos += toPrint;
            budget -= toPrint;
            output.scrollTop = output.scrollHeight;
        }

        if (currentLinePos >= currentLineText.length) {
            currentLineElement = null;
        }
    }
}

function stopPrinting() {
    isPrinting = false;
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    currentLineElement = null;
}


