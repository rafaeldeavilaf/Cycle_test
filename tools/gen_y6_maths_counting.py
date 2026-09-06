#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator for: Y6 Maths - Counting and Sequences (Cycle Test #1)
Every value is computed with exact Fraction arithmetic, so no answer or
distractor can be arithmetically wrong. Output: subjects/<slug>/data.js
"""
import json, random
from fractions import Fraction as F

random.seed(20261105)

# ---------------------------------------------------------------- formatting
def fint(x):
    x = F(x)
    assert x.denominator == 1, x
    return str(x.numerator)

def fdec(x):
    """Format a Fraction as a terminating decimal string."""
    x = F(x)
    s = "-" if x < 0 else ""
    x = abs(x)
    whole = x.numerator // x.denominator
    rem = x - whole
    if rem == 0:
        return s + str(whole)
    digits = ""
    for _ in range(8):
        rem *= 10
        d = rem.numerator // rem.denominator
        digits += str(d)
        rem -= d
        if rem == 0:
            break
    assert rem == 0, f"non-terminating decimal {x}"
    return s + f"{whole}.{digits}"

def ffrac(x):
    """Format a Fraction as a mixed number, e.g. 7/3 -> '2 1/3'."""
    x = F(x)
    s = "-" if x < 0 else ""
    x = abs(x)
    w = x.numerator // x.denominator
    r = x - w
    if r == 0:
        return s + str(w)
    if w == 0:
        return f"{s}{r.numerator}/{r.denominator}"
    return f"{s}{w} {r.numerator}/{r.denominator}"

FMT = {"int": fint, "dec": fdec, "frac": ffrac}

# ---------------------------------------------------------------- builders
def mk(stem, correct, wrongs, hint, explain, seq=None, sub=None):
    """Build one variant with 4 unique shuffled options."""
    opts, seen = [correct], {str(correct)}
    for w in wrongs:
        w = str(w)
        if w not in seen:
            seen.add(w); opts.append(w)
        if len(opts) == 4:
            break
    assert len(opts) == 4, f"need 4 unique options, got {opts} for: {stem}"
    order = opts[:]
    random.shuffle(order)
    return {
        "stem": stem,
        "sub": sub,
        "seq": seq,
        "options": order,
        "answer": order.index(str(correct)),
        "hint": hint,
        "explain": explain,
    }

def fam(fid, skill, variants):
    assert len(variants) >= 4, fid
    return {"id": fid, "skill": skill, "variants": variants}

def seq_of(start, step, n, mode, blanks=()):
    f = FMT[mode]
    out = []
    for i in range(n):
        out.append("?" if i in blanks else f(F(start) + i * F(step)))
    return out

LEVELS = []

# ================================================================== LEVEL 1
L1 = []

# 1. continue counting back (whole)
v = []
for start, step, shown in [(10, -5, 3), (20, -4, 3), (45, -9, 3), (24, -6, 3), (36, -8, 3)]:
    f = FMT["int"]
    nxt = F(start) + shown * F(step)
    v.append(mk(
        f"Count back in steps of {abs(step)}. What number comes next?",
        f(nxt),
        [f(nxt + F(step)), f(nxt - F(step)), f(F(start) + (shown - 1) * F(step) - 2 * F(step))],
        f"Each jump goes down by {abs(step)}. Take {abs(step)} off the last number you can see.",
        f"The last visible number is <code>{f(F(start)+(shown-1)*F(step))}</code>. Counting back {abs(step)} gives <code>{f(F(start)+(shown-1)*F(step))} - {abs(step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "int", blanks={shown}),
    ))
L1.append(fam("L1F1", "count back", v))

# 2. continue counting on (whole)
v = []
for start, step, shown in [(7, 7, 3), (25, 25, 3), (11, 11, 3), (9, 9, 3), (15, 15, 3)]:
    f = FMT["int"]
    nxt = F(start) + shown * F(step)
    v.append(mk(
        f"Count on in steps of {step}. What number comes next?",
        f(nxt),
        [f(nxt + F(step)), f(nxt - F(step)), f(nxt + 1)],
        f"Add {step} to the last number in the sequence.",
        f"<code>{f(F(start)+(shown-1)*F(step))} + {step} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "int", blanks={shown}),
    ))
L1.append(fam("L1F2", "count on", v))

# 3. find the step size
v = []
for start, step in [(3, 6), (4, 7), (9, 8), (5, 9), (2, 12)]:
    f = FMT["int"]
    v.append(mk(
        "What is the step size in this sequence?",
        str(step),
        [str(step + 1), str(step - 1), str(step * 2)],
        "Subtract one term from the term straight after it.",
        f"<code>{f(F(start)+F(step))} - {f(F(start))} = {step}</code>. The sequence counts on in steps of {step}.",
        seq=seq_of(start, step, 4, "int"),
    ))
L1.append(fam("L1F3", "find the step", v))

# 4. missing middle term
v = []
for start, step, gap in [(12, 6, 1), (30, -7, 2), (14, 9, 1), (20, 8, 2), (40, -6, 1)]:
    f = FMT["int"]
    val = F(start) + gap * F(step)
    v.append(mk(
        "Which number belongs in the gap?",
        f(val),
        [f(val + F(step)), f(val - F(step)), f(val + 2)],
        "Work out the step first, then add it to the number before the gap.",
        f"The step is {f(F(step))}. So the missing term is <code>{f(F(start)+(gap-1)*F(step))} + ({f(F(step))}) = {f(val)}</code>.",
        seq=seq_of(start, step, 4, "int", blanks={gap}),
    ))
L1.append(fam("L1F4", "missing term", v))

# 5. missing FIRST term
v = []
for second, step in [(14, 7), (36, 12), (22, 11), (18, 9), (30, 15)]:
    f = FMT["int"]
    first = F(second) - F(step)
    v.append(mk(
        "The first number is missing. What is it?",
        f(first),
        [f(first + F(step)), f(first - F(step)), f(F(second) + F(step))],
        "Go backwards one step from the second number.",
        f"The step is {step}, so the first term is <code>{f(F(second))} - {step} = {f(first)}</code>.",
        seq=seq_of(second - step, step, 4, "int", blanks={0}),
    ))
L1.append(fam("L1F5", "missing first term", v))

# 6. odd one out
v = []
for start, step, bad_pos, off in [(6, 6, 3, 1), (8, 8, 2, 2), (9, 9, 4, 1), (7, 7, 3, 2), (12, 12, 2, 1)]:
    f = FMT["int"]
    s = [F(start) + i * F(step) for i in range(5)]
    bad = s[bad_pos] + off
    disp = [f(x) for x in s]
    disp[bad_pos] = f(bad)
    v.append(mk(
        f"This should count on in steps of {step}, but one number is wrong. Which one?",
        f(bad),
        [f(s[bad_pos]), f(s[bad_pos - 1]), f(s[bad_pos - 2])],
        f"Check every jump. Which gap is not exactly {step}?",
        f"Counting on in {step}s the term should be <code>{f(s[bad_pos])}</code>, not <code>{f(bad)}</code>.",
        seq=disp,
    ))
L1.append(fam("L1F6", "spot the error", v))

# 7. two steps ahead
v = []
for start, step, shown in [(9, 9, 3), (13, 6, 3), (40, -8, 3), (11, 7, 3), (50, -6, 3)]:
    f = FMT["int"]
    val = F(start) + (shown + 1) * F(step)
    v.append(mk(
        "What number comes <b>two steps</b> after the last one shown?",
        f(val),
        [f(val - F(step)), f(val + F(step)), f(val - 2 * F(step))],
        "Take two jumps, not one.",
        f"Last shown is <code>{f(F(start)+(shown-1)*F(step))}</code>. Two jumps of {f(F(step))}: <code>{f(F(start)+shown*F(step))}</code> then <code>{f(val)}</code>.",
        seq=seq_of(start, step, shown, "int") + ["?", "?"],
    ))
L1.append(fam("L1F7", "two steps ahead", v))

# 8. which sequence counts back in N
v = []
for step, base in [(8, 80), (6, 54), (9, 90), (7, 70), (12, 96)]:
    f = FMT["int"]
    good = ", ".join(f(F(base) - i * F(step)) for i in range(4))
    w1 = ", ".join(f(F(base) + i * F(step)) for i in range(4))
    w2 = ", ".join(f(F(base) - i * F(step + 1)) for i in range(4))
    w3 = ", ".join(f(F(base) - i * F(step - 1)) for i in range(4))
    v.append(mk(
        f"Which sequence counts <b>back</b> in steps of {step}?",
        good, [w1, w2, w3],
        "Back means the numbers get smaller. Check the size of the jump too.",
        f"<code>{good}</code> goes down by exactly {step} each time.",
    ))
L1.append(fam("L1F8", "identify the rule", v))

# 9. counting back through zero
v = []
for start, step, shown in [(6, -3, 3), (10, -5, 3), (8, -4, 3), (12, -6, 3), (14, -7, 3)]:
    f = FMT["int"]
    nxt = F(start) + shown * F(step)
    v.append(mk(
        f"Keep counting back in {abs(step)}s. What comes after zero?",
        f(nxt),
        [f(-nxt), f(nxt + F(step)), "0"],
        "Below zero the numbers are negative and keep getting further from zero.",
        f"After 0 you keep subtracting {abs(step)}: <code>0 - {abs(step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "int", blanks={shown}),
    ))
L1.append(fam("L1F9", "crossing zero", v))

# 10. word problem: lift / stairs
v = []
for floors, step, jumps in [(30, 4, 3), (24, 3, 4), (45, 5, 3), (36, 6, 4), (50, 10, 3)]:
    f = FMT["int"]
    end = floors - step * jumps
    v.append(mk(
        f"A lift starts on floor {floors} and goes down {step} floors at a time. Which floor is it on after {jumps} moves?",
        f(F(end)),
        [f(F(end) + step), f(F(end) - step), f(F(floors) + step * jumps)],
        f"{jumps} moves of {step} floors is {jumps} x {step} floors in total.",
        f"<code>{jumps} x {step} = {jumps*step}</code>, and <code>{floors} - {jumps*step} = {end}</code>.",
    ))
L1.append(fam("L1F10", "word problem", v))

# 11. how many steps between two terms
v = []
for a, step, jumps in [(12, 6, 5), (7, 7, 6), (20, 4, 7), (15, 5, 8), (9, 3, 9)]:
    b = a + step * jumps
    v.append(mk(
        f"A sequence counts on in steps of {step}. How many steps are there from {a} to {b}?",
        str(jumps),
        [str(jumps + 1), str(jumps - 1), str(b - a)],
        "Find the difference first, then divide by the step size.",
        f"<code>{b} - {a} = {b-a}</code> and <code>{b-a} / {step} = {jumps}</code> steps.",
    ))
L1.append(fam("L1F11", "count the steps", v))

# 12. nth term of a simple counting sequence
v = []
for start, step, n in [(6, 6, 8), (4, 4, 9), (5, 5, 7), (3, 3, 10), (7, 7, 6)]:
    f = FMT["int"]
    val = F(start) + (n - 1) * F(step)
    v.append(mk(
        f"This sequence counts on in {step}s. What is the {n}th number?",
        f(val),
        [f(val + F(step)), f(val - F(step)), f(val + 2 * F(step))],
        f"The 1st number is {start}. To reach the {n}th you take {n-1} more jumps.",
        f"<code>{start} + {n-1} x {step} = {f(val)}</code>.",
        seq=seq_of(start, step, 4, "int") + ["..."],
    ))
L1.append(fam("L1F12", "nth number", v))

# 13. step size from non-adjacent terms
v = []
for start, step in [(5, 5), (6, 7), (10, 9), (4, 6), (8, 11)]:
    f = FMT["int"]
    v.append(mk(
        "Two numbers are missing. What is the step size?",
        str(step),
        [str(step * 3), str(step + 1), str(step - 1)],
        "The two shown numbers are 3 jumps apart. Divide the difference by 3.",
        f"<code>{f(F(start)+3*F(step))} - {f(F(start))} = {3*step}</code>, and <code>{3*step} / 3 = {step}</code>.",
        seq=[fint(F(start)), "?", "?", fint(F(start) + 3 * F(step))],
    ))
L1.append(fam("L1F13", "step from a gap", v))

# 14. counting back in large steps
v = []
for start, step, shown in [(100, -12, 3), (200, -25, 3), (150, -15, 3), (120, -20, 3), (300, -50, 3)]:
    f = FMT["int"]
    nxt = F(start) + shown * F(step)
    v.append(mk(
        f"Count back in steps of {abs(step)}. What comes next?",
        f(nxt),
        [f(nxt + F(step)), f(nxt - F(step)), f(nxt + 10)],
        f"Subtract {abs(step)} from the last number shown.",
        f"<code>{f(F(start)+(shown-1)*F(step))} - {abs(step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "int", blanks={shown}),
    ))
L1.append(fam("L1F14", "large steps", v))

# 15. describe the rule in words
v = []
for start, step in [(11, 11), (60, -12), (7, 13), (14, 14), (80, -16)]:
    f = FMT["int"]
    word = f"count on in steps of {step}" if step > 0 else f"count back in steps of {abs(step)}"
    v.append(mk(
        "Which sentence describes this sequence?",
        word.capitalize() + ".",
        [(f"Count on in steps of {abs(step)+1}." if step > 0 else f"Count back in steps of {abs(step)+1}."),
         (f"Count back in steps of {abs(step)}." if step > 0 else f"Count on in steps of {abs(step)}."),
         f"Multiply by {abs(step)} each time."],
        "Check the direction first, then the size of the jump.",
        f"Each jump is {f(F(step))}, so the rule is: {word}.",
        seq=seq_of(start, step, 4, "int"),
    ))
L1.append(fam("L1F15", "rule in words", v))

# 16. fill two blanks at once
v = []
for start, step in [(18, 9), (33, -11), (16, 8), (21, 7), (48, -12)]:
    f = FMT["int"]
    a, b = F(start) + 3 * F(step), F(start) + 4 * F(step)
    v.append(mk(
        "Which pair fills the two gaps?",
        f"{f(a)}, {f(b)}",
        [f"{f(b)}, {f(a)}", f"{f(a+F(step))}, {f(b+F(step))}", f"{f(a-F(step))}, {f(b)}"],
        "Work out one gap, then use the same step again.",
        f"The step is {f(F(step))}: <code>{f(F(start)+2*F(step))} -> {f(a)} -> {f(b)}</code>.",
        seq=seq_of(start, step, 5, "int", blanks={3, 4}),
    ))
L1.append(fam("L1F16", "fill two gaps", v))

LEVELS.append({
    "id": 1,
    "name": "WHOLE NUMBER WAY",
    "subtitle": "Counting on and back with whole numbers",
    "briefing": [
        "<p>Welcome to the Quest, Samuel. Before anything else you need the basic move: <b>the step</b>.</p>",
        "<p>A sequence is just numbers that follow a rule. To find the rule, look at the jump between two numbers next to each other.</p>",
        "<div class='example'>4, 11, 18, 25<br>11 - 4 = 7<br>18 - 11 = 7<br>Rule: count on in steps of 7</div>",
        "<ul>"
        "<li><b>Count on</b> = numbers get bigger. Add the step.</li>"
        "<li><b>Count back</b> = numbers get smaller. Subtract the step.</li>"
        "<li>Always check <i>two</i> jumps, not one, so you don't guess.</li>"
        "</ul>",
        "<p>If numbers are missing in the middle, count how many jumps are hidden and divide the difference by that number.</p>",
        "<p class='text-dim'>Mission: 16 challenges. Get one wrong and it comes back later with different numbers.</p>",
    ],
    "questions": L1,
})

# ================================================================== LEVEL 2
L2 = []

# 1-2. count on / back in decimal steps
v = []
for start, step, shown in [(F(21,10), F(3,10), 3), (F(45,10), F(2,10), 3), (F(12,10), F(4,10), 3), (F(35,10), F(5,10), 3), (F(105,100), F(15,100), 3)]:
    f = FMT["dec"]
    nxt = start + shown * step
    v.append(mk(
        f"Count on in steps of {f(step)}. What comes next?",
        f(nxt),
        [f(nxt + step), f(nxt - step), f(nxt + 1)],
        "Add the tenths. If the tenths pass 10, carry one whole.",
        f"<code>{f(start+(shown-1)*step)} + {f(step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "dec", blanks={shown}),
    ))
L2.append(fam("L2F1", "decimal count on", v))

v = []
for start, step, shown in [(F(52,10), F(-3,10), 3), (F(8,1), F(-25,100), 3), (F(41,10), F(-7,10), 3), (F(63,10), F(-4,10), 3), (F(5,1), F(-15,100), 3)]:
    f = FMT["dec"]
    nxt = start + shown * step
    v.append(mk(
        f"Count back in steps of {f(-step)}. What comes next?",
        f(nxt),
        [f(nxt - step), f(nxt + step), f(nxt - F(1,10))],
        "Subtract carefully. Line up the decimal points in your head.",
        f"<code>{f(start+(shown-1)*step)} - {f(-step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "dec", blanks={shown}),
    ))
L2.append(fam("L2F2", "decimal count back", v))

# 3. crossing a whole number
v = []
for start, step, shown in [(F(88,100), F(6,100), 4), (F(96,10), F(3,10), 3), (F(185,100), F(5,100), 4), (F(94,100), F(4,100), 3), (F(88,10), F(6,10), 3)]:
    f = FMT["dec"]
    nxt = start + shown * step
    v.append(mk(
        f"Careful &mdash; this one crosses a whole number. Count on in {f(step)}.",
        f(nxt),
        [f(nxt + step), f(nxt - step), f(nxt + F(1,10))],
        "When the tenths or hundredths reach 10, exchange them for the next column up.",
        f"<code>{f(start+(shown-1)*step)} + {f(step)} = {f(nxt)}</code>. Crossing a whole is just normal addition.",
        seq=seq_of(start, step, shown + 1, "dec", blanks={shown}),
    ))
L2.append(fam("L2F3", "crossing a whole", v))

# 4. find the decimal step
v = []
for start, step in [(F(13,10), F(4,10), ), (F(25,100), F(15,100)), (F(6,1), F(-45,100)), (F(24,10), F(7,10)), (F(45,100), F(25,100))]:
    f = FMT["dec"]
    v.append(mk(
        "What is the step size?",
        f(step),
        [f(-step), f(step + F(1,10)), f(step * 2)],
        "Subtract the first number from the second one.",
        f"<code>{f(start+step)} - {f(start)} = {f(step)}</code>.",
        seq=seq_of(start, step, 4, "dec"),
    ))
L2.append(fam("L2F4", "find decimal step", v))

# 5. missing decimal term
v = []
for start, step, gap in [(F(34,10), F(6,10), 2), (F(9,10), F(-15,100), 1), (F(72,100), F(9,100), 2), (F(52,10), F(-4,10), 2), (F(15,100), F(12,100), 1)]:
    f = FMT["dec"]
    val = start + gap * step
    v.append(mk(
        "Which number fills the gap?",
        f(val),
        [f(val + step), f(val - step), f(val + F(1,100))],
        "Find the step from two numbers you can see, then apply it once.",
        f"The step is <code>{f(step)}</code>, so the gap is <code>{f(start+(gap-1)*step)} + ({f(step)}) = {f(val)}</code>.",
        seq=seq_of(start, step, 4, "dec", blanks={gap}),
    ))
L2.append(fam("L2F5", "missing decimal", v))

# 6. decimal odd one out
v = []
for start, step, bad_pos, off in [(F(2,10), F(3,10), 3, F(1,10)), (F(15,10), F(25,100), 2, F(5,100)), (F(4,1), F(-4,10), 3, F(1,10)), (F(3,10), F(2,10), 3, F(1,10)), (F(25,10), F(5,10), 2, F(2,10))]:
    f = FMT["dec"]
    s = [start + i * step for i in range(5)]
    disp = [f(x) for x in s]; disp[bad_pos] = f(s[bad_pos] + off)
    v.append(mk(
        f"One number breaks the pattern of {f(step)}. Which is it?",
        f(s[bad_pos] + off),
        [f(s[bad_pos]), f(s[bad_pos - 1]), f(s[bad_pos - 2])],
        "Check each jump in turn. One of them is the wrong size.",
        f"It should be <code>{f(s[bad_pos])}</code> to keep the step of {f(step)}.",
        seq=disp,
    ))
L2.append(fam("L2F6", "decimal error", v))

# 7. decimals below zero
v = []
for start, step, shown in [(F(6,10), F(-3,10), 3), (F(1,1), F(-4,10), 3), (F(75,100), F(-25,100), 4), (F(8,10), F(-4,10), 3), (F(5,10), F(-25,100), 3)]:
    f = FMT["dec"]
    nxt = start + shown * step
    v.append(mk(
        "Keep counting back past zero. What comes next?",
        f(nxt),
        [f(-nxt), f(nxt + step), "0"],
        "Once you pass zero the numbers become negative decimals.",
        f"<code>{f(start+(shown-1)*step)} - {f(-step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "dec", blanks={shown}),
    ))
L2.append(fam("L2F7", "negative decimals", v))

# 8. nth decimal term
v = []
for start, step, n in [(F(5,10), F(5,10), 8), (F(2,10), F(3,10), 7), (F(11,10), F(2,10), 9), (F(4,10), F(4,10), 6), (F(15,10), F(25,100), 8)]:
    f = FMT["dec"]
    val = start + (n - 1) * step
    v.append(mk(
        f"What is the {n}th number in this sequence?",
        f(val),
        [f(val + step), f(val - step), f(val + 2 * step)],
        f"You need {n-1} jumps from the first number, not {n}.",
        f"<code>{f(start)} + {n-1} x {f(step)} = {f(val)}</code>.",
        seq=seq_of(start, step, 4, "dec") + ["..."],
    ))
L2.append(fam("L2F8", "nth decimal", v))

# 9. money context
v = []
for start, step, weeks in [(F(1250,100), F(-175,100), 3), (F(2,1), F(45,100), 4), (F(30,1), F(-25,10), 5), (F(2050,100), F(-250,100), 4), (F(5,1), F(125,100), 3)]:
    f = FMT["dec"]
    end = start + weeks * step
    word = "spends" if step < 0 else "saves"
    v.append(mk(
        f"Samuel has &pound;{f(start)} and {word} &pound;{f(abs(step))} each week. How much after {weeks} weeks?",
        "£" + f(end),
        ["£" + f(end + step), "£" + f(end - step), "£" + f(start + step)],
        f"That is {weeks} equal steps of {f(abs(step))}.",
        f"<code>{weeks} x {f(abs(step))} = {f(weeks*abs(step))}</code>, so the answer is <code>{f(end)}</code>.",
    ))
L2.append(fam("L2F9", "decimal word problem", v))

# 10. two decimal gaps
v = []
for start, step in [(F(14,10), F(3,10)), (F(5,1), F(-15,100)), (F(23,100), F(11,100)), (F(26,10), F(4,10)), (F(8,1), F(-25,100))]:
    f = FMT["dec"]
    a, b = start + 3 * step, start + 4 * step
    v.append(mk(
        "Which pair fills both gaps?",
        f"{f(a)}, {f(b)}",
        [f"{f(b)}, {f(a)}", f"{f(a+step)}, {f(b+step)}", f"{f(a)}, {f(b+step)}"],
        "Same step twice in a row.",
        f"Step is {f(step)}: <code>{f(start+2*step)} -> {f(a)} -> {f(b)}</code>.",
        seq=seq_of(start, step, 5, "dec", blanks={3, 4}),
    ))
L2.append(fam("L2F10", "fill two gaps", v))

# 11. which sequence has the given step
v = []
for step, base in [(F(25,100), F(1,1)), (F(6,10), F(2,1)), (F(-15,100), F(3,1)), (F(5,10), F(1,1)), (F(-2,10), F(4,1))]:
    f = FMT["dec"]
    good = ", ".join(f(base + i * step) for i in range(4))
    w1 = ", ".join(f(base + i * (step + F(5,100))) for i in range(4))
    w2 = ", ".join(f(base - i * step) for i in range(4))
    w3 = ", ".join(f(base + i * step * 2) for i in range(4))
    v.append(mk(
        f"Which sequence has a step of exactly {f(step)}?",
        good, [w1, w2, w3],
        "Test the first jump of each option.",
        f"In <code>{good}</code> every jump is {f(step)}.",
    ))
L2.append(fam("L2F11", "match the step", v))

# 12. backwards to find the start
v = []
for third, step in [(F(46,10), F(4,10)), (F(2,1), F(-3,10)), (F(125,100), F(15,100)), (F(52,10), F(6,10)), (F(3,1), F(-25,100))]:
    f = FMT["dec"]
    first = third - 2 * step
    v.append(mk(
        "The first two numbers are missing. What was the first number?",
        f(first),
        [f(first + step), f(first - step), f(first - 2 * step)],
        "Go backwards two jumps from the number you can see.",
        f"<code>{f(third)} - 2 x ({f(step)}) = {f(first)}</code>.",
        seq=["?", "?", f(third), f(third + step)],
    ))
L2.append(fam("L2F12", "find the start", v))

# 13. how many steps
v = []
for a, step, jumps in [(F(15,10), F(5,10), 6), (F(2,1), F(25,100), 8), (F(10,1), F(-4,10), 5), (F(3,1), F(5,10), 7), (F(12,1), F(-25,100), 6)]:
    f = FMT["dec"]
    b = a + jumps * step
    v.append(mk(
        f"A sequence steps by {f(step)}. How many steps from {f(a)} to {f(b)}?",
        str(jumps),
        [str(jumps + 1), str(jumps - 1), str(jumps * 2)],
        "Difference divided by step size.",
        f"<code>{f(b)} - {f(a)} = {f(b-a)}</code>, and <code>{f(b-a)} / {f(abs(step))} = {jumps}</code>.",
    ))
L2.append(fam("L2F13", "count decimal steps", v))

# 14. measurement context
v = []
for start, step, n in [(F(125,100), F(15,100), 4), (F(3,1), F(-35,100), 4), (F(48,10), F(6,10), 3), (F(1,1), F(25,100), 4), (F(24,10), F(3,10), 5)]:
    f = FMT["dec"]
    end = start + n * step
    if step > 0:
        stem = (f"A plant is {f(start)} m tall and grows {f(step)} m each month. "
                f"How tall is it after {n} months?")
    else:
        stem = (f"A candle is {f(start)} cm long and burns down {f(-step)} cm every hour. "
                f"How long is it after {n} hours?")
    unit = " m" if step > 0 else " cm"
    v.append(mk(
        stem,
        f(end) + unit,
        [f(end - step) + unit, f(end + step) + unit, f(start + step) + unit],
        f"That is {n} equal changes of {f(abs(step))}.",
        f"<code>{n} &times; {f(abs(step))} = {f(n*abs(step))}</code>, so "
        f"<code>{f(start)} {'+' if step>0 else '&minus;'} {f(n*abs(step))} = {f(end)}</code>{unit}.",
    ))
L2.append(fam("L2F14", "measures", v))

# 15. mixed step sizes trap
v = []
for start, step in [(F(3,10), F(3,10)), (F(7,10), F(2,10)), (F(105,100), F(5,100)), (F(6,10), F(6,10)), (F(25,100), F(25,100))]:
    f = FMT["dec"]
    v.append(mk(
        "Which statement is true about this sequence?",
        f"It counts on in steps of {f(step)}.",
        [f"It counts on in steps of {f(step*2)}.",
         f"It counts back in steps of {f(step)}.",
         f"It doubles each time."],
        "Doubling and adding are different. Check by subtracting.",
        f"Every jump is exactly <code>{f(step)}</code>, so it counts on in {f(step)}.",
        seq=seq_of(start, step, 4, "dec"),
    ))
L2.append(fam("L2F15", "true statement", v))

# 16. count on 3 steps
v = []
for start, step in [(F(19,10), F(4,10)), (F(52,100), F(13,100)), (F(9,1), F(-45,100)), (F(25,10), F(6,10)), (F(4,1), F(-35,100))]:
    f = FMT["dec"]
    val = start + 3 * step
    v.append(mk(
        "What number is <b>3 steps</b> after the first one?",
        f(val),
        [f(val - step), f(val + step), f(start + step)],
        "Three jumps, so multiply the step by 3 and add it on.",
        f"<code>3 x {f(step)} = {f(3*step)}</code>, and <code>{f(start)} + {f(3*step)} = {f(val)}</code>.",
        seq=[f(start), "?", "?", "?"],
    ))
L2.append(fam("L2F16", "three steps on", v))

LEVELS.append({
    "id": 2,
    "name": "DECIMAL DEPTHS",
    "subtitle": "Counting on and back in decimal steps",
    "briefing": [
        "<p>Level 2. The numbers now have a decimal point, but the rule has not changed: <b>find the step, then repeat it</b>.</p>",
        "<div class='example'>2.1, 2.4, 2.7, ?<br>2.4 - 2.1 = 0.3<br>2.7 + 0.3 = 3.0</div>",
        "<ul>"
        "<li>Line up the decimal points before you add or subtract.</li>"
        "<li>When the tenths reach 10, exchange them for one whole: 2.7 + 0.3 = 3.0, not 2.10.</li>"
        "<li>0.25 steps are quarters &mdash; four of them make one whole.</li>"
        "</ul>",
        "<p><b>Danger zone:</b> crossing a whole number and crossing zero. Slow down at those two points.</p>",
    ],
    "questions": L2,
})

# ================================================================== LEVEL 3
L3 = []

def frac_word(step):
    return ffrac(abs(step))

# 1. count back in thirds (from the study guide)
v = []
for start, den, shown in [(F(3), 3, 3), (F(4), 4, 3), (F(5), 5, 3), (F(2), 2, 3), (F(4), 8, 3)]:
    f = FMT["frac"]; step = F(-1, den)
    nxt = start + shown * step
    v.append(mk(
        f"Count back in steps of 1/{den}. What comes next?",
        f(nxt),
        [f(nxt - step), f(nxt + step), f(nxt - F(1, den) * 2)],
        f"Each jump takes away 1/{den}. When you run out of {den}ths, break down a whole.",
        f"<code>{f(start+(shown-1)*step)} - 1/{den} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "frac", blanks={shown}),
    ))
L3.append(fam("L3F1", "count back in fractions", v))

# 2. count on in fractions
v = []
for start, num, den, shown in [(F(1,2), 1, 2, 3), (F(1,4), 1, 4, 4), (F(2,5), 1, 5, 4), (F(1,3), 1, 3, 3), (F(1,8), 3, 8, 3)]:
    f = FMT["frac"]; step = F(num, den)
    nxt = start + shown * step
    v.append(mk(
        f"Count on in steps of {num}/{den}. What comes next?",
        f(nxt),
        [f(nxt + step), f(nxt - step), f(nxt + (F(1, den) if num > 1 else 2 * step))],
        f"Add {num}/{den} each time. {den} of them make one whole.",
        f"<code>{f(start+(shown-1)*step)} + {num}/{den} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "frac", blanks={shown}),
    ))
L3.append(fam("L3F2", "count on in fractions", v))

# 3. find the fraction step
v = []
for start, num, den in [(F(1,3), 1, 3), (F(1,4), 3, 4), (F(2,5), 2, 5), (F(1,6), 1, 6), (F(1,8), 3, 8)]:
    f = FMT["frac"]; step = F(num, den)
    v.append(mk(
        "What is the step size?",
        f(step),
        [f(step * 2), f(step * 3), f(F(1, den + 1))],
        "Subtract the first term from the second one.",
        f"<code>{f(start+step)} - {f(start)} = {f(step)}</code>.",
        seq=seq_of(start, step, 4, "frac"),
    ))
L3.append(fam("L3F3", "find fraction step", v))

# 4. crossing a whole number with fractions
v = []
for start, num, den, shown in [(F(2,3), 1, 3, 2), (F(3,4), 1, 4, 2), (F(4,5), 2, 5, 2), (F(5,6), 1, 6, 2), (F(7,8), 1, 8, 2)]:
    f = FMT["frac"]; step = F(num, den)
    nxt = start + shown * step
    v.append(mk(
        "This one crosses a whole number. What comes next?",
        f(nxt),
        [f(nxt + step), f(nxt - step), f(F(num * shown, den))],
        f"When you collect {den} lots of 1/{den}, that is one whole.",
        f"<code>{f(start+(shown-1)*step)} + {num}/{den} = {f(nxt)}</code>. Remember to write it as a mixed number.",
        seq=seq_of(start, step, shown + 1, "frac", blanks={shown}),
    ))
L3.append(fam("L3F4", "fractions past a whole", v))

# 5. missing fraction term
v = []
for start, num, den, gap in [(F(1,2), 1, 2, 2), (F(1,3), 2, 3, 1), (F(3,4), 1, 4, 2), (F(1,6), 1, 6, 2), (F(1,8), 3, 8, 1)]:
    f = FMT["frac"]; step = F(num, den)
    val = start + gap * step
    v.append(mk(
        "Which fraction fills the gap?",
        f(val),
        [f(val + step), f(val - step), f(val + (F(1, den) if num > 1 else 2 * step))],
        "Work out the step from two terms you can see.",
        f"Step is {f(step)}, so the gap is <code>{f(start+(gap-1)*step)} + {f(step)} = {f(val)}</code>.",
        seq=seq_of(start, step, 4, "frac", blanks={gap}),
    ))
L3.append(fam("L3F5", "missing fraction", v))

# 6. fractions below zero
v = []
for start, den, shown in [(F(2,3), 3, 3), (F(1,2), 2, 2), (F(3,4), 4, 4), (F(1,3), 3, 3), (F(2,5), 5, 4)]:
    f = FMT["frac"]; step = F(-1, den)
    nxt = start + shown * step
    v.append(mk(
        "Keep counting back past zero. What comes next?",
        f(nxt),
        [f(-nxt), f(nxt + step), "0"],
        "Past zero the fractions become negative.",
        f"<code>{f(start+(shown-1)*step)} - 1/{den} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "frac", blanks={shown}),
    ))
L3.append(fam("L3F6", "negative fractions", v))

# 7. nth fraction term
v = []
for start, num, den, n in [(F(1,4), 1, 4, 9), (F(1,3), 1, 3, 7), (F(1,5), 2, 5, 6), (F(1,6), 1, 6, 7), (F(1,2), 1, 2, 8)]:
    f = FMT["frac"]; step = F(num, den)
    val = start + (n - 1) * step
    v.append(mk(
        f"What is the {n}th term?",
        f(val),
        [f(val + step), f(val - step), f(val + 2 * step)],
        f"{n-1} jumps from the first term.",
        f"<code>{f(start)} + {n-1} x {f(step)} = {f(val)}</code>.",
        seq=seq_of(start, step, 4, "frac") + ["..."],
    ))
L3.append(fam("L3F7", "nth fraction", v))

# 8. equivalent step spotted differently
v = []
for start, num, den, alt in [(F(0), 2, 4, "1/2"), (F(0), 2, 6, "1/3"), (F(0), 5, 10, "1/2"), (F(0), 3, 6, "1/2"), (F(0), 4, 8, "1/2")]:
    f = FMT["frac"]; step = F(num, den)
    v.append(mk(
        f"The step is written as {num}/{den}. Which is the same size?",
        alt,
        [f"{num}/{den*2}", f"{num*2}/{den}", f"{den}/{num}"],
        "Simplify the fraction by dividing top and bottom by the same number.",
        f"<code>{num}/{den} = {alt}</code> once you simplify.",
    ))
L3.append(fam("L3F8", "equivalent steps", v))

# 9. fraction odd one out
v = []
for start, num, den, bad_pos in [(F(1,3), 1, 3, 3), (F(1,4), 1, 4, 2), (F(2,5), 1, 5, 3), (F(1,6), 1, 6, 3), (F(1,2), 1, 2, 2)]:
    f = FMT["frac"]; step = F(num, den)
    s = [start + i * step for i in range(5)]
    bad = s[bad_pos] + F(1, den)
    disp = [f(x) for x in s]; disp[bad_pos] = f(bad)
    v.append(mk(
        f"One term breaks the pattern of {f(step)}. Which one?",
        f(bad),
        [f(s[bad_pos]), f(s[bad_pos - 1]), f(s[bad_pos - 2])],
        "Check each jump in turn.",
        f"It should be <code>{f(s[bad_pos])}</code> to keep steps of {f(step)}.",
        seq=disp,
    ))
L3.append(fam("L3F9", "fraction error", v))

# 10. mixed number subtraction
v = []
for whole, num, den in [(3, 1, 3), (4, 1, 4), (5, 2, 5), (6, 1, 6), (2, 1, 2)]:
    f = FMT["frac"]
    start = F(whole)
    step = F(-num, den)
    val = start + 4 * step
    v.append(mk(
        f"Start at {whole} and count back in {num}/{den} four times. Where do you land?",
        f(val),
        [f(val - step), f(val + step), f(start - F(num, den))],
        f"Four jumps of {num}/{den} is {num*4}/{den} altogether.",
        f"<code>4 x {num}/{den} = {f(F(num*4,den))}</code>, and <code>{whole} - {f(F(num*4,den))} = {f(val)}</code>.",
    ))
L3.append(fam("L3F10", "four fraction jumps", v))

# 11. pizza / cake context
v = []
for den, eaten, start_whole in [(4, 3, 2), (3, 2, 3), (8, 5, 2), (6, 4, 2), (5, 3, 3)]:
    f = FMT["frac"]
    left = F(start_whole) - F(eaten, den)
    v.append(mk(
        f"There are {start_whole} whole pizzas, each cut into {den} equal slices. {eaten} slices are eaten. How much pizza is left?",
        f(left),
        [f(left + F(1, den)), f(left - F(1, den)), f(F(start_whole) - F(eaten))],
        f"Each slice is 1/{den} of a pizza.",
        f"<code>{eaten} slices = {f(F(eaten,den))}</code>, so <code>{start_whole} - {f(F(eaten,den))} = {f(left)}</code>.",
    ))
L3.append(fam("L3F11", "fraction word problem", v))

# 12. how many fraction steps
v = []
for den, jumps in [(3, 6), (4, 7), (5, 8), (6, 4), (8, 5)]:
    f = FMT["frac"]
    a = F(0); b = F(jumps, den)
    v.append(mk(
        f"How many steps of 1/{den} does it take to get from 0 to {f(b)}?",
        str(jumps),
        [str(jumps + 1), str(jumps - 1), str(den)],
        f"Ask: how many {den}ths are in {f(b)}?",
        f"<code>{f(b)} = {jumps}/{den}</code>, so it takes {jumps} steps.",
    ))
L3.append(fam("L3F12", "count fraction steps", v))

# 13. two fraction gaps
v = []
for start, num, den in [(F(1,2), 1, 2), (F(1,3), 1, 3), (F(1,4), 3, 4), (F(1,6), 1, 6), (F(1,8), 3, 8)]:
    f = FMT["frac"]; step = F(num, den)
    a, b = start + 3 * step, start + 4 * step
    v.append(mk(
        "Which pair fills both gaps?",
        f"{f(a)}, {f(b)}",
        [f"{f(b)}, {f(a)}", f"{f(a+step)}, {f(b+step)}", f"{f(a)}, {f(b+step)}"],
        "Apply the same step twice.",
        f"Step is {f(step)}: <code>{f(start+2*step)} -> {f(a)} -> {f(b)}</code>.",
        seq=seq_of(start, step, 5, "frac", blanks={3, 4}),
    ))
L3.append(fam("L3F13", "fill two gaps", v))

# 14. fraction vs decimal step
v = []
for den, dec in [(2, "0.5"), (4, "0.25"), (5, "0.2"), (8, "0.125"), (25, "0.04")]:
    v.append(mk(
        f"A sequence counts on in steps of 1/{den}. What is the same step as a decimal?",
        dec,
        [str(round(1/den + 0.1, 2)), str(den) + ".0", str(round(1/den * 2, 2))],
        f"Divide 1 by {den}.",
        f"<code>1 / {den} = {dec}</code>.",
    ))
L3.append(fam("L3F14", "fraction to decimal", v))

# 15. find the start
v = []
for third, num, den in [(F(2), 1, 3), (F(3), 1, 4), (F(5,2), 1, 2), (F(3), 1, 6), (F(4), 3, 8)]:
    f = FMT["frac"]; step = F(num, den)
    first = third - 2 * step
    v.append(mk(
        "The first two terms are missing. What was the first term?",
        f(first),
        [f(first + step), f(first - step), f(first - 2 * step)],
        "Go back two jumps from the term you can see.",
        f"<code>{f(third)} - 2 x {f(step)} = {f(first)}</code>.",
        seq=["?", "?", f(third), f(third + step)],
    ))
L3.append(fam("L3F15", "find the start", v))

# 16. compare two fraction sequences
v = []
for den_a, den_b in [(3, 4), (5, 2), (8, 3), (6, 3), (4, 10)]:
    f = FMT["frac"]
    v.append(mk(
        f"Sequence A counts on in 1/{den_a}. Sequence B counts on in 1/{den_b}. Which grows faster?",
        ("A" if F(1, den_a) > F(1, den_b) else "B"),
        [("B" if F(1, den_a) > F(1, den_b) else "A"), "They grow at the same rate", "It depends where they start"],
        "The bigger the bottom number, the smaller the fraction.",
        f"<code>1/{den_a} {'>' if F(1,den_a) > F(1,den_b) else '<'} 1/{den_b}</code>, so "
        f"{'A' if F(1,den_a) > F(1,den_b) else 'B'} takes bigger jumps.",
    ))
L3.append(fam("L3F16", "compare steps", v))

LEVELS.append({
    "id": 3,
    "name": "FRACTION FOREST",
    "subtitle": "Counting on and back in fraction steps",
    "briefing": [
        "<p>Level 3. Same rule, new number type. A fraction step works exactly like a decimal step.</p>",
        "<div class='example'>3, 2 2/3, 2 1/3, ?<br>Each jump takes away 1/3<br>2 1/3 - 1/3 = 2</div>",
        "<ul>"
        "<li>The bottom number (denominator) tells you how many pieces make one whole.</li>"
        "<li>To cross a whole going down, break one whole into that many pieces: 2 = 1 3/3.</li>"
        "<li>Write answers as mixed numbers: <b>2 1/3</b>, not 7/3.</li>"
        "<li>Careful: <b>1/3 is bigger than 1/4</b>. A bigger bottom number means smaller pieces.</li>"
        "</ul>",
    ],
    "questions": L3,
})

# ================================================================== LEVEL 4
L4 = []

# 1. temperature drop
v = []
for start, step, n in [(5, -3, 3), (8, -5, 3), (2, -4, 2), (4, -6, 2), (7, -4, 3)]:
    f = FMT["int"]
    end = F(start) + n * F(step)
    v.append(mk(
        f"The temperature is {start}&deg;C and falls {abs(step)}&deg;C every hour. What is it after {n} hours?",
        f(end) + "°C",
        [f(-end) + "°C", f(end - F(step)) + "°C", f(end + F(step)) + "°C"],
        f"{n} falls of {abs(step)} is {n*abs(step)} in total.",
        f"<code>{start} - {n*abs(step)} = {f(end)}</code>&deg;C.",
    ))
L4.append(fam("L4F1", "temperature", v))

# 2. continue into negatives
v = []
for start, step, shown in [(4, -6, 3), (9, -7, 3), (3, -8, 3), (5, -9, 3), (2, -5, 3)]:
    f = FMT["int"]
    nxt = F(start) + shown * F(step)
    v.append(mk(
        f"Count back in {abs(step)}s. What comes next?",
        f(nxt),
        [f(-nxt), f(nxt - F(step)), f(nxt + F(step))],
        "Keep going in the same direction. Negative numbers get further from zero as you subtract.",
        f"<code>{f(F(start)+(shown-1)*F(step))} - {abs(step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "int", blanks={shown}),
    ))
L4.append(fam("L4F2", "into the negatives", v))

# 3. counting UP from a negative
v = []
for start, step, shown in [(-14, 5, 3), (-18, 6, 3), (-21, 7, 3), (-24, 8, 3), (-16, 4, 3)]:
    f = FMT["int"]
    nxt = F(start) + shown * F(step)
    v.append(mk(
        f"Count on in {step}s. What comes next?",
        f(nxt),
        [f(nxt - F(step)), f(nxt + F(step)), f(nxt - 2 * F(step))],
        "Adding makes negative numbers move towards zero, then past it.",
        f"<code>{f(F(start)+(shown-1)*F(step))} + {step} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "int", blanks={shown}),
    ))
L4.append(fam("L4F3", "up from negatives", v))

# 4. difference across zero
v = []
for a, b in [(-6, 9), (-12, 4), (-7, 15), (-9, 6), (-5, 11)]:
    v.append(mk(
        f"How far is it from {a} to {b} on a number line?",
        str(b - a),
        [str(b + a), str(b - a - 1), str(b - a + 1)],
        "Count up to zero first, then carry on.",
        f"From {a} up to 0 is {abs(a)}. From 0 up to {b} is {b}. Total <code>{abs(a)} + {b} = {b-a}</code>.",
    ))
L4.append(fam("L4F4", "distance across zero", v))

# 5. which is smallest (cuatro numeros reales, sin opciones de relleno)
v = []
for quad in [[-8, -3, -11, -5], [-2, -9, -14, -6], [-1, -7, -4, -12],
             [-5, -13, -8, -2], [-16, -4, -10, -7]]:
    lo = min(quad)
    others = [str(x) for x in quad if x != lo]
    v.append(mk(
        "Which of these numbers is the smallest?",
        str(lo),
        others,
        "On a number line, further left = smaller. The minus sign flips your usual thinking.",
        f"All four are below zero. <code>{lo}</code> sits furthest to the left on the number line, "
        f"so it is the smallest &mdash; even though {abs(lo)} is the biggest digit.",
        seq=[str(x) for x in quad],
    ))
L4.append(fam("L4F5", "compare negatives", v))

# 6. negative decimals
v = []
for start, step, shown in [(F(-12,10), F(-3,10), 3), (F(-25,100), F(-25,100), 3), (F(-2,1), F(-4,10), 3), (F(-8,10), F(-4,10), 3), (F(-15,100), F(-15,100), 3)]:
    f = FMT["dec"]
    nxt = start + shown * step
    v.append(mk(
        f"Count back in {f(-step)}. What comes next?",
        f(nxt),
        [f(nxt - step), f(-nxt), f(nxt + step)],
        "You are already below zero, so subtracting takes you further down.",
        f"<code>{f(start+(shown-1)*step)} - {f(-step)} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "dec", blanks={shown}),
    ))
L4.append(fam("L4F6", "negative decimals", v))

# 7. missing term crossing zero
v = []
for start, step, gap in [(7, -5, 2), (11, -6, 3), (6, -4, 2), (8, -6, 2), (9, -5, 3)]:
    f = FMT["int"]
    val = F(start) + gap * F(step)
    v.append(mk(
        "Which number fills the gap?",
        f(val),
        [f(-val), f(val + F(step)), f(val - 2 * F(step))],
        "The step never changes, even when you cross zero.",
        f"Step is {step}: <code>{f(F(start)+(gap-1)*F(step))} + ({step}) = {f(val)}</code>.",
        seq=seq_of(start, step, 5, "int", blanks={gap}),
    ))
L4.append(fam("L4F7", "gap across zero", v))

# 8. depth / sea level context
v = []
for start, step, n in [(-30, 8, 3), (-45, 15, 2), (-24, 5, 4), (-50, 12, 4), (-28, 9, 3)]:
    f = FMT["int"]
    end = F(start) + n * F(step)
    v.append(mk(
        f"A submarine is at {start} m and rises {step} m each minute. Where is it after {n} minutes?",
        f(end) + " m",
        [f(F(start) - n * F(step)) + " m", f(end - F(step)) + " m", f(end + F(step)) + " m"],
        "Rising means adding.",
        f"<code>{n} x {step} = {n*step}</code>, so <code>{start} + {n*step} = {f(end)}</code> m.",
    ))
L4.append(fam("L4F8", "depth problem", v))

# 9. find the step in a negative sequence
v = []
for start, step in [(-20, 6), (-9, -4), (-15, 5), (-30, 7), (-12, -5)]:
    f = FMT["int"]
    v.append(mk(
        "What is the step size?",
        f(F(step)),
        [f(-F(step)), f(F(step) + 1), f(F(step) * 2)],
        "Second term minus first term. Keep the sign.",
        f"<code>{f(F(start)+F(step))} - ({f(F(start))}) = {f(F(step))}</code>.",
        seq=seq_of(start, step, 4, "int"),
    ))
L4.append(fam("L4F9", "step with negatives", v))

# 10. order negatives
v = []
for trio in [[-3, -11, -7], [-2, -9, -5], [-14, -6, -20], [-5, -13, -8], [-4, -16, -10]]:
    good = ", ".join(str(x) for x in sorted(trio))
    w1 = ", ".join(str(x) for x in sorted(trio, reverse=True))
    w2 = ", ".join(str(abs(x)) for x in sorted(trio, key=abs))
    w3 = ", ".join(str(x) for x in trio)
    v.append(mk(
        f"Put these in order, smallest first: {', '.join(str(x) for x in trio)}",
        good, [w1, w2, w3],
        "The one furthest from zero on the negative side is the smallest.",
        f"Smallest first: <code>{good}</code>.",
    ))
L4.append(fam("L4F10", "ordering", v))

# 11. how many steps to reach a negative
v = []
for start, step, jumps in [(12, -4, 5), (10, -3, 6), (18, -6, 4), (14, -5, 5), (20, -8, 4)]:
    end = start + step * jumps
    v.append(mk(
        f"Counting back in {abs(step)}s from {start}, how many steps to reach {end}?",
        str(jumps),
        [str(jumps + 1), str(jumps - 1), str(abs(end))],
        "Find the total distance, then divide by the step.",
        f"<code>{start} - ({end}) = {start-end}</code>, and <code>{start-end} / {abs(step)} = {jumps}</code>.",
    ))
L4.append(fam("L4F11", "steps to a negative", v))

# 12. negative fractions
v = []
for start, den, shown in [(F(1,2), 2, 3), (F(1,3), 3, 3), (F(1,4), 4, 3), (F(1,5), 5, 3), (F(1,6), 6, 3)]:
    f = FMT["frac"]; step = F(-1, den)
    nxt = start + shown * step
    v.append(mk(
        f"Count back in 1/{den}. What comes next?",
        f(nxt),
        [f(-nxt), f(nxt - step), f(nxt + step)],
        "Below zero the fractions keep the same step size.",
        f"<code>{f(start+(shown-1)*step)} - 1/{den} = {f(nxt)}</code>.",
        seq=seq_of(start, step, shown + 1, "frac", blanks={shown}),
    ))
L4.append(fam("L4F12", "negative fractions", v))

# 13. temperature rise/fall difference
v = []
for morning, night in [(-4, 7), (-9, 3), (-2, 12), (-6, 5), (-3, 9)]:
    v.append(mk(
        f"At night the temperature is {morning}&deg;C. By midday it is {night}&deg;C. How much did it rise?",
        str(night - morning) + "°C",
        [str(night + morning) + "°C", str(night - morning - 1) + "°C", str(night - morning + 1) + "°C"],
        "Count up to zero, then keep counting.",
        f"From {morning} to 0 is {abs(morning)}, then 0 to {night} is {night}: <code>{abs(morning)} + {night} = {night-morning}</code>&deg;C.",
    ))
L4.append(fam("L4F13", "temperature rise", v))

# 14. spot the error across zero
v = []
for start, step, bad_pos in [(9, -4, 3), (6, -5, 3), (12, -7, 3), (10, -6, 3), (8, -6, 3)]:
    f = FMT["int"]
    s = [F(start) + i * F(step) for i in range(5)]
    bad = -s[bad_pos] if s[bad_pos] < 0 else s[bad_pos] + 1
    disp = [f(x) for x in s]; disp[bad_pos] = f(bad)
    v.append(mk(
        "One term is wrong. Which one?",
        f(bad),
        [f(s[bad_pos]), f(s[bad_pos - 1]), f(s[bad_pos - 2])],
        "A common mistake is bouncing back up instead of going through zero.",
        f"The sequence should keep dropping by {abs(step)}, so it should be <code>{f(s[bad_pos])}</code>.",
        seq=disp,
    ))
L4.append(fam("L4F14", "error across zero", v))

# 15. mixed: negative decimal nth term
v = []
for start, step, n in [(F(2,1), F(-3,10), 8), (F(1,1), F(-25,100), 7), (F(3,1), F(-4,10), 9), (F(2,1), F(-25,100), 9), (F(4,1), F(-5,10), 10)]:
    f = FMT["dec"]
    val = start + (n - 1) * step
    v.append(mk(
        f"What is the {n}th term?",
        f(val),
        [f(val - step), f(val + step), f(val + 2 * step)],
        f"{n-1} jumps from the start.",
        f"<code>{f(start)} + {n-1} x ({f(step)}) = {f(val)}</code>.",
        seq=seq_of(start, step, 4, "dec") + ["..."],
    ))
L4.append(fam("L4F15", "negative nth term", v))

# 16. which sequence crosses zero
v = []
for step, base in [(4, 6), (5, 8), (3, 5), (6, 10), (7, 12)]:
    f = FMT["int"]
    good = ", ".join(f(F(base) - i * F(step)) for i in range(4))
    w1 = ", ".join(f(F(base) + i * F(step)) for i in range(4))
    w2 = ", ".join(f(F(base + 40) - i * F(step)) for i in range(4))
    w3 = ", ".join(f(F(base) - i * F(1)) for i in range(4))
    v.append(mk(
        f"Which sequence counts back in {step}s and ends up below zero?",
        good, [w1, w2, w3],
        "Check the direction and whether the last term is negative.",
        f"<code>{good}</code> drops by {step} each time and finishes below zero.",
    ))
L4.append(fam("L4F16", "crossing zero", v))

LEVELS.append({
    "id": 4,
    "name": "NEGATIVE CAVERNS",
    "subtitle": "Counting through zero into negative numbers",
    "briefing": [
        "<p>Level 4. Below zero the number line keeps going. The step does not change when you cross zero &mdash; only your care level does.</p>",
        "<div class='example'>6, 3, 0, -3, -6, -9<br>Same step of 3 all the way through</div>",
        "<ul>"
        "<li><b>-9 is smaller than -3.</b> Further left = smaller.</li>"
        "<li>To find the distance from -6 to 4: go up to zero (6), then carry on (4). Total 10.</li>"
        "<li>Adding moves you <b>right</b>, subtracting moves you <b>left</b>. Always.</li>"
        "<li>The classic trap: bouncing back up after zero. Don't. Keep going.</li>"
        "</ul>",
    ],
    "questions": L4,
})

# ================================================================== LEVEL 5
L5 = []

def rule_text(m, c):
    if c == 0:
        return f"Multiply the position by {m}"
    if c > 0:
        return f"Multiply the position by {m}, then add {c}"
    return f"Multiply the position by {m}, then subtract {abs(c)}"

def terms(m, c, n=4):
    return [m * i + c for i in range(1, n + 1)]

# 1. identify the rule (multiples only) - from the study guide
v = []
for m in [8, 6, 9, 7, 12]:
    good = rule_text(m, 0)
    v.append(mk(
        "What is the position-to-term rule?",
        good,
        [rule_text(m + 1, 0), rule_text(m, 1), f"Add {m} to the position"],
        f"Ask: what do I do to the position (1, 2, 3, 4) to get the term?",
        f"Position 1 gives {m}, position 2 gives {2*m}. Every term is the position times {m}. Rule: <b>{good.lower()}</b>.",
        seq=[str(t) for t in terms(m, 0)],
        sub="Positions are 1st, 2nd, 3rd, 4th.",
    ))
L5.append(fam("L5F1", "find the rule", v))

# 2. value at a position (multiples)
v = []
for m, n in [(8, 10), (7, 12), (9, 11), (6, 13), (11, 9)]:
    v.append(mk(
        f"What is the value of the term in the {n}th position?",
        str(m * n),
        [str(m * n + m), str(m * n - m), str(m + n)],
        f"The rule is multiply the position by {m}.",
        f"<code>{n} x {m} = {m*n}</code>.",
        seq=[str(t) for t in terms(m, 0)],
    ))
L5.append(fam("L5F2", "value at position", v))

# 3. position of a value (multiples)
v = []
for m, pos in [(8, 12), (6, 15), (9, 14), (7, 13), (12, 11)]:
    val = m * pos
    v.append(mk(
        f"What is the position of the term with a value of {val}?",
        f"{pos}th",
        [f"{pos+1}th", f"{pos-1}th", f"{val}th"],
        "Do the opposite of the rule: divide instead of multiply.",
        f"<code>{val} / {m} = {pos}</code>, so it is the {pos}th term.",
        seq=[str(t) for t in terms(m, 0)],
    ))
L5.append(fam("L5F3", "position of a value", v))

# 4. two-step rule identification
v = []
for m, c in [(3, 2), (4, 1), (5, -1), (2, 3), (6, 2)]:
    good = rule_text(m, c)
    v.append(mk(
        "What is the position-to-term rule?",
        good,
        [rule_text(m, 0), rule_text(m + 1, c), rule_text(m, -c if c else 1)],
        f"The terms go up in {m}s, so start with 'multiply by {m}'. Then check what to add or subtract.",
        f"Position 1 x {m} = {m}, but the term is {m+c}. So you also {'add ' + str(c) if c > 0 else 'subtract ' + str(abs(c))}.",
        seq=[str(t) for t in terms(m, c)],
    ))
L5.append(fam("L5F4", "two-step rule", v))

# 5. value at position (two-step)
v = []
for m, c, n in [(3, 2, 10), (4, 1, 12), (6, -2, 9), (7, 3, 8), (2, 6, 15)]:
    val = m * n + c
    v.append(mk(
        f"The rule is: {rule_text(m, c).lower()}. What is the {n}th term?",
        str(val),
        [str(m * n), str(val + m), str(m + n + c)],
        "Multiply first, then add or subtract. Order matters.",
        f"<code>{n} x {m} = {m*n}</code>, then <code>{m*n} {'+' if c>0 else '-'} {abs(c)} = {val}</code>.",
    ))
L5.append(fam("L5F5", "two-step value", v))

# 6. position from value (two-step)
v = []
for m, c, pos in [(3, 2, 20), (5, 1, 14), (4, -3, 16), (6, 2, 12), (8, 3, 9)]:
    val = m * pos + c
    v.append(mk(
        f"The rule is: {rule_text(m, c).lower()}. Which position has the value {val}?",
        f"{pos}th",
        [f"{pos+1}th", f"{pos-1}th", (f"{val//m}th" if val // m not in (pos, pos+1, pos-1) else f"{pos+2}th")],
        "Undo the rule backwards: first undo the add/subtract, then undo the multiply.",
        f"<code>{val} {'-' if c>0 else '+'} {abs(c)} = {m*pos}</code>, then <code>{m*pos} / {m} = {pos}</code>.",
    ))
L5.append(fam("L5F6", "two-step position", v))

# 7. is N a term in this sequence? (con razon, no solo si/no)
v = []
for m, test, yes in [(8, 96, True), (7, 50, False), (6, 84, True), (9, 60, False), (4, 72, True)]:
    pos = test // m
    if yes:
        correct = f"Yes &mdash; it is the {pos}th term"
        wrongs = [f"Yes &mdash; it is the {test}th term",
                  f"No &mdash; {test} is not in the {m} times table",
                  f"No &mdash; the sequence stops at {m*4}"]
        why = (f"<code>{test} &divide; {m} = {pos}</code> exactly, so {test} is the {pos}th term. "
               f"The rule keeps going for ever, so the sequence does not stop at the four terms shown.")
    else:
        correct = f"No &mdash; {test} is not in the {m} times table"
        wrongs = [f"Yes &mdash; it is the {test}th term",
                  f"Yes &mdash; it is the {m}th term",
                  f"No &mdash; {test} is too big for this sequence"]
        why = (f"<code>{test} &divide; {m} = {test/m:.2f}</code>, which is not a whole number, "
               f"so no position gives {test}. Size is not the problem &mdash; the sequence goes on for ever.")
    v.append(mk(
        f"The rule is: multiply the position by {m}. Is {test} a term in this sequence?",
        correct, wrongs,
        f"Divide {test} by {m}. A whole-number answer means it IS a term, and tells you its position.",
        why,
        seq=[str(t) for t in terms(m, 0)] + ["..."],
        sub="The first four terms are shown. The sequence carries on for ever.",
    ))
L5.append(fam("L5F7", "is it a term", v))

# 8. large position
v = []
for m, c, n in [(8, 0, 100), (3, 1, 50), (5, -2, 40), (4, 0, 200), (7, 2, 60)]:
    val = m * n + c
    v.append(mk(
        f"Using the rule {rule_text(m, c).lower()}, what is the {n}th term?",
        str(val),
        [str(val + m), str(val - m), str(m * n)] if c else [str(val + m), str(val - m), str(n + m)],
        "The rule works for any position, however large. No need to list them.",
        f"<code>{n} x {m} = {m*n}</code>" + (f", then {'+' if c>0 else '-'} {abs(c)} gives <code>{val}</code>." if c else "."),
    ))
L5.append(fam("L5F8", "far position", v))

# 9. match sequence to rule
v = []
for m, c in [(4, 1), (3, 5), (6, -1), (5, 2), (2, 7)]:
    good = ", ".join(str(t) for t in terms(m, c))
    w1 = ", ".join(str(t) for t in terms(m, 0))
    w2 = ", ".join(str(t) for t in terms(m, -c if c else 2))
    w3 = ", ".join(str(t) for t in terms(m + 1, c))
    v.append(mk(
        f"Which sequence follows the rule: {rule_text(m, c).lower()}?",
        good, [w1, w2, w3],
        "Test position 1 and position 2 on each option.",
        f"Position 1: <code>1 x {m} {'+' if c>0 else '-'} {abs(c)} = {m+c}</code>. Only <code>{good}</code> starts there.",
    ))
L5.append(fam("L5F9", "match rule", v))

# 10. position-to-term vs term-to-term
v = []
for m in [7, 9, 4, 6, 8]:
    v.append(mk(
        f"A sequence has the rule: multiply the position by {m}. Which statement is also true?",
        f"Each term is {m} more than the one before it.",
        [f"Each term is {m} times the one before it.",
         f"Each term is {m} less than the one before it.",
         f"Each term is {m + 1} more than the one before it."],
        "Work out the first two terms and compare them.",
        f"Terms are {', '.join(str(t) for t in terms(m,0))}. The gap between them is {m} every time.",
    ))
L5.append(fam("L5F10", "rule types", v))

# 11. build the rule from a described sequence
v = []
for m, c in [(10, -3, ), (2, 5), (7, 2), (4, 3), (9, -2)]:
    good = rule_text(m, c)
    v.append(mk(
        "These are the first four terms. What is the position-to-term rule?",
        good,
        [rule_text(m, 0), rule_text(c if c > 1 else m + 1, m), rule_text(m + 1, c - 1)],
        f"Check the gap between terms first &mdash; that gives you the multiplier.",
        f"The terms go up in {m}s so the rule starts 'multiply by {m}'. Position 1 x {m} = {m}, and the first term is {m+c}, so you {'add ' + str(c) if c>0 else 'subtract ' + str(abs(c))}.",
        seq=[str(t) for t in terms(m, c)],
    ))
L5.append(fam("L5F11", "build the rule", v))

# 12. missing term using the rule
v = []
for m, c, gap in [(8, 0, 5), (3, 4, 6), (5, 3, 7), (6, 0, 8), (4, 5, 9)]:
    val = m * gap + c
    shown = [str(t) for t in terms(m, c, 4)] + ["..."] + ["?"]
    v.append(mk(
        f"The rule is {rule_text(m, c).lower()}. What is the {gap}th term?",
        str(val),
        [str(val + m), str(val - m), str(m * gap)] if c else [str(val + m), str(val - m), str(val + 1)],
        f"Use the rule directly with position {gap}.",
        f"<code>{gap} x {m} {'+ ' + str(c) if c>0 else ('- ' + str(abs(c)) if c else '')} = {val}</code>.",
        seq=shown,
    ))
L5.append(fam("L5F12", "term from rule", v))

# 13. word problem with a rule
v = []
for m, c, n in [(4, 2, 12), (6, 3, 9), (5, 1, 15), (3, 4, 14), (7, 2, 10)]:
    val = m * n + c
    v.append(mk(
        f"A pattern of tiles uses {m} tiles for each step plus {c} extra tiles at the start. How many tiles in pattern number {n}?",
        str(val),
        [str(m * n), str(val + m), str(m + n + c)],
        f"Tiles = position x {m} + {c}.",
        f"<code>{n} x {m} = {m*n}</code>, plus {c} = <code>{val}</code>.",
    ))
L5.append(fam("L5F13", "pattern problem", v))

# 14. which position gives a value (two-step, harder)
v = []
for m, c, pos in [(9, 4, 11), (7, -5, 13), (12, 6, 8), (6, 5, 14), (8, -3, 12)]:
    val = m * pos + c
    v.append(mk(
        f"Rule: {rule_text(m, c).lower()}. A term has the value {val}. What is its position?",
        f"{pos}th",
        [f"{pos+1}th", f"{pos-1}th", (f"{val//m}th" if val // m not in (pos, pos+1, pos-1) else f"{pos+3}th")],
        "Undo the last operation first.",
        f"<code>{val} {'-' if c>0 else '+'} {abs(c)} = {m*pos}</code>, and <code>{m*pos} / {m} = {pos}</code>.",
    ))
L5.append(fam("L5F14", "reverse the rule", v))

# 15. compare two rules
# 15. dos reglas: cuanto se separan (respuesta numerica, sin opciones de relleno)
v = []
for (m1, c1), (m2, c2), n in [((3, 5), (4, 1), 8), ((5, 2), (6, -2), 7), ((2, 9), (3, 1), 10),
                              ((4, 3), (6, -5), 6), ((7, 1), (5, 9), 5)]:
    a, b = m1 * n + c1, m2 * n + c2
    assert a != b, ("los dos terminos coinciden", m1, c1, m2, c2, n)
    diff = abs(a - b)
    v.append(mk(
        f"Sequence A: {rule_text(m1,c1).lower()}. "
        f"Sequence B: {rule_text(m2,c2).lower()}. "
        f"How much bigger is the larger {n}th term?",
        str(diff),
        [str(a), str(b), str(diff + n)],
        f"Work out the {n}th term of each sequence first, then subtract the smaller from the bigger.",
        f"A: <code>{n} &times; {m1} {'+' if c1>0 else '&minus;'} {abs(c1)} = {a}</code>. "
        f"B: <code>{n} &times; {m2} {'+' if c2>0 else '&minus;'} {abs(c2)} = {b}</code>. "
        f"The gap is <code>{max(a,b)} &minus; {min(a,b)} = {diff}</code>.",
        sub=f"Both sequences start at position 1.",
    ))
L5.append(fam("L5F15", "compare rules", v))

# 16. spot the wrong term using the rule
v = []
for m, c, bad_pos in [(8, 0, 3), (4, 3, 2), (6, 1, 4), (7, 0, 3), (5, 2, 2)]:
    t = terms(m, c, 5)
    bad = t[bad_pos] + 2
    disp = [str(x) for x in t]; disp[bad_pos] = str(bad)
    v.append(mk(
        f"The rule is {rule_text(m, c).lower()}, but one term is wrong. Which one?",
        str(bad),
        [str(t[bad_pos]), str(t[bad_pos - 1]), str(t[bad_pos - 2])],
        "Apply the rule to each position in turn.",
        f"Position {bad_pos+1} should be <code>{bad_pos+1} x {m} {'+ ' + str(c) if c else ''} = {t[bad_pos]}</code>, not {bad}.",
        seq=disp,
    ))
L5.append(fam("L5F16", "rule error", v))

LEVELS.append({
    "id": 5,
    "name": "RULE MASTER TOWER",
    "subtitle": "Position-to-term rules (find any term instantly)",
    "briefing": [
        "<p>Final level. A <b>position-to-term rule</b> lets you jump straight to any term without listing them all.</p>",
        "<div class='example'>8, 16, 24, 32<br>Position:  1   2   3   4<br>Term:      8  16  24  32<br>Rule: multiply the position by 8<br>10th term: 10 x 8 = 80<br>Value 96 is at position: 96 / 8 = 12</div>",
        "<p>Some rules have <b>two steps</b>:</p>",
        "<div class='example'>5, 8, 11, 14<br>Gap is 3, so start with 'x 3'<br>1 x 3 = 3, but the term is 5, so also '+ 2'<br>Rule: multiply the position by 3, then add 2</div>",
        "<ul>"
        "<li>To go <b>forwards</b> (position &rarr; term): multiply, then add or subtract.</li>"
        "<li>To go <b>backwards</b> (term &rarr; position): undo the add/subtract first, then divide.</li>"
        "<li>The gap between terms is always the number you multiply by.</li>"
        "</ul>",
    ],
    "questions": L5,
})

# ---------------------------------------------------------------- output
DATA = {
    "meta": {
        "slug": "y6-maths-counting-sequences",
        "year": "Year 6",
        "subject": "Maths",
        "topic": "Counting and Sequences",
        "test": "Cycle Test #1",
        "accent": "maths",
    },
    "levels": LEVELS,
}

# sanity checks
for lv in DATA["levels"]:
    assert len(lv["questions"]) >= 15, (lv["id"], len(lv["questions"]))
    for q in lv["questions"]:
        assert len(q["variants"]) >= 3, q["id"]
        for var in q["variants"]:
            assert len(var["options"]) == 4, q["id"]
            assert len(set(var["options"])) == 4, (q["id"], var["options"])
            assert 0 <= var["answer"] < 4, q["id"]

import os, sys
out_dir = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, "data.js")
with open(path, "w", encoding="utf-8") as fh:
    fh.write("/* AUTO-GENERATED by tools/gen_y6_maths_counting.py - do not hand-edit */\n")
    fh.write("window.QUIZ_DATA = ")
    fh.write(json.dumps(DATA, ensure_ascii=False, indent=1))
    fh.write(";\n")

n_fam = sum(len(l["questions"]) for l in DATA["levels"])
n_var = sum(len(q["variants"]) for l in DATA["levels"] for q in l["questions"])
print(f"OK -> {path}")
print(f"levels={len(DATA['levels'])} families={n_fam} variants={n_var}")
