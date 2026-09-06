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
        "<p>Welcome. Before anything else you need the basic move: <b>the step</b>.</p>",
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
    word = "spend" if step < 0 else "save"
    v.append(mk(
        # Segunda persona: el personaje no tiene nombre ni genero, y el juego
        # lo usan 25 companeros. Nunca se escribe aqui el nombre de nadie.
        f"You have &pound;{f(start)} and {word} &pound;{f(abs(step))} each week. How much after {weeks} weeks?",
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

# ================================================================== v2: 7 NIVELES
# Hasta aqui se han construido los 5 mundos de v1, repartidos por TIPO DE NUMERO.
# v2 reparte por HABILIDAD (PLAN-V2 §1): las cuatro primeras siguen siendo
# "aplicar un paso" en enteros/decimales/fracciones/negativos, y se anaden los
# dos niveles donde esta la dificultad real del Cycle Test —hallar el paso e
# invertir la regla—. Cada nivel baja de 16 a 12 familias para dejar sitio al
# jefe sin alargar la partida.
#
# Las familias existentes NO se reescriben: se recolocan. Su aritmetica ya esta
# auditada; volver a escribirla seria reintroducir el riesgo mas caro del
# proyecto.

BYID = {}
for _src in (L1, L2, L3, L4, L5):
    for _f in _src:
        BYID[_f["id"]] = _f

def take(*ids):
    """Recoloca familias existentes por id, fallando si alguna no existe."""
    out = []
    for i in ids:
        assert i in BYID, "familia inexistente: " + i
        out.append(BYID[i])
    return out

# ---------------------------------------------------------------- nuevas familias

def four_opts(correct, wrongs):
    """Descarta distractores que coincidan con la respuesta y deja 3."""
    seen, out = {str(correct)}, []
    for w in wrongs:
        w = str(w)
        if w not in seen:
            seen.add(w); out.append(w)
    assert len(out) >= 3, (correct, wrongs)
    return out[:3]

# --- N1: dos terminos siguientes (aplicar el paso dos veces) -----------------
v = []
for start, step, shown in [(4, 7, 3), (100, -25, 3), (13, 6, 3), (60, -12, 3), (8, 9, 3)]:
    f = FMT["int"]
    a = F(start) + shown * F(step)
    b = a + F(step)
    good = f"{f(a)}, {f(b)}"
    v.append(mk(
        "What are the next TWO numbers?",
        good,
        four_opts(good, [f"{f(a)}, {f(a + 2*F(step))}", f"{f(a - F(step))}, {f(a)}", f"{f(b)}, {f(b + F(step))}"]),
        f"Find the step first, then take it twice from the last number you can see.",
        f"The step is <code>{f(F(step))}</code>. <code>{f(F(start)+(shown-1)*F(step))} &rarr; {f(a)} &rarr; {f(b)}</code>.",
        seq=seq_of(start, step, shown + 2, "int", blanks={shown, shown + 1}),
    ))
N1_NEW = [fam("L1F17", "next two terms", v)]

# --- N5: hallar el paso y la direccion ---------------------------------------
N5_NEW = []

# paso negativo cruzando el cero
v = []
for start, step in [(8, -3), (5, -4), (11, -5), (7, -6), (9, -7)]:
    f = FMT["int"]
    v.append(mk(
        "What is the step in this sequence?",
        f(F(step)),
        four_opts(f(F(step)), [f(-F(step)), f(F(step) + 1), f(F(step) - 1)]),
        "Take one term away from the one before it. Going down means the step is negative.",
        f"<code>{f(F(start)+F(step))} - {f(F(start))} = {f(F(step))}</code>, so the step is <code>{f(F(step))}</code>.",
        seq=seq_of(start, step, 4, "int"),
    ))
N5_NEW.append(fam("L5NF1", "negative step", v))

# direccion + tamano del paso, en palabras
v = []
for start, step, mode in [(F(75,10), F(-3,10), "dec"), (12, 4, "int"), (F(21,10), F(3,10), "dec"),
                          (40, -8, "int"), (F(95,100), F(-5,100), "dec")]:
    f = FMT[mode]
    word = "back" if step < 0 else "on"
    good = f"count {word} in {f(abs(F(step)))}s"
    other = "on" if step < 0 else "back"
    v.append(mk(
        "Which rule describes this sequence?",
        good,
        four_opts(good, [f"count {other} in {f(abs(F(step)))}s",
                         f"count {word} in {f(abs(F(step))*2)}s",
                         f"count {other} in {f(abs(F(step))*2)}s"]),
        "Two things to get right: the direction, and the size of the jump.",
        f"The numbers get {'smaller' if step < 0 else 'bigger'}, and each jump is <code>{f(abs(F(step)))}</code>.",
        seq=seq_of(start, step, 4, mode),
    ))
N5_NEW.append(fam("L5NF2", "direction and step", v))

# paso oculto entre terminos NO consecutivos (decimales)
v = []
for start, step, gaps in [(F(21,10), F(3,10), 3), (F(4,1), F(-25,100), 4), (F(12,10), F(2,10), 4),
                          (F(5,1), F(-5,10), 3), (F(65,100), F(15,100), 3)]:
    f = FMT["dec"]
    end = start + gaps * step
    v.append(mk(
        f"The sequence goes from {f(start)} to {f(end)} in {gaps} equal jumps. How big is each jump?",
        f(abs(step)),
        four_opts(f(abs(step)), [f(abs(step) * 2), f(abs(end - start)), f(abs(step) / 2)]),
        f"Find the total change first, then share it between the {gaps} jumps.",
        f"Total change <code>{f(abs(end-start))}</code> over {gaps} jumps: <code>{f(abs(end-start))} / {gaps} = {f(abs(step))}</code>.",
        seq=seq_of(start, step, gaps + 1, "dec", blanks=set(range(1, gaps))),
    ))
N5_NEW.append(fam("L5NF3", "hidden decimal step", v))

# paso oculto en fracciones
v = []
for start, step, gaps in [(F(1,1), F(1,3), 3), (F(3,1), F(-1,4), 4), (F(1,2), F(1,2), 3),
                          (F(2,1), F(-1,3), 3), (F(1,4), F(1,4), 4)]:
    f = FMT["frac"]
    end = start + gaps * step
    v.append(mk(
        f"The sequence goes from {f(start)} to {f(end)} in {gaps} equal jumps. How big is each jump?",
        f(abs(step)),
        four_opts(f(abs(step)), [f(abs(step) * 2), f(abs(end - start)), f(abs(step) + F(1,12))]),
        f"Work out the whole change, then split it into {gaps} equal parts.",
        f"The whole change is <code>{f(abs(end-start))}</code>, shared between {gaps} jumps: "
        f"<code>{f(abs(end-start))} / {gaps} = {f(abs(step))}</code>.",
        seq=seq_of(start, step, gaps + 1, "frac", blanks=set(range(1, gaps))),
    ))
N5_NEW.append(fam("L5NF4", "hidden fraction step", v))

# elegir la secuencia que encaja con una regla dada
v = []
for start, step, mode in [(6, 6, "int"), (F(15,10), F(5,10), "dec"), (30, -7, "int"),
                          (F(2,1), F(-3,10), "dec"), (9, 11, "int")]:
    f = FMT[mode]
    word = "back" if step < 0 else "on"
    good = ", ".join(seq_of(start, step, 4, mode))
    v.append(mk(
        f"Which sequence counts {word} in {f(abs(F(step)))}s?",
        good,
        four_opts(good, [", ".join(seq_of(start, -F(step), 4, mode)),
                         ", ".join(seq_of(start, F(step) * 2, 4, mode)),
                         ", ".join(seq_of(start + F(step), F(step) + (F(1,10) if mode == "dec" else 1), 4, mode))]),
        "Check the direction first, then measure one jump.",
        f"Starting at <code>{f(F(start))}</code> and jumping <code>{f(F(step))}</code> each time gives <code>{good}</code>.",
    ))
N5_NEW.append(fam("L5NF5", "match the sequence", v))

# que secuencia tiene el paso mas grande
v = []
# El formato se declara, no se adivina: un tercio no tiene decimal exacto y
# fdec() falla. Explicito = el generador no puede equivocarse solo.
for a_start, a_step, b_start, b_step, mode in [
        (4, 6, 10, 4, "int"),
        (F(1,1), F(3,10), F(2,1), F(5,10), "dec"),
        (20, -9, 30, -5, "int"),
        (F(1,2), F(1,4), F(1,1), F(3,4), "frac"),
        (7, 8, 12, 11, "int")]:
    f = FMT[mode]
    A = ", ".join(seq_of(a_start, a_step, 3, mode))
    B = ", ".join(seq_of(b_start, b_step, 3, mode))
    bigger = "A" if abs(F(a_step)) > abs(F(b_step)) else "B"
    v.append(mk(
        f"Sequence A: {A}<br>Sequence B: {B}<br>Which one has the bigger step?",
        bigger,
        ["A" if bigger == "B" else "B", "They are the same", "Neither: they have no step"],
        "Measure one jump in each. Ignore the direction: compare the size.",
        f"A jumps <code>{f(abs(F(a_step)))}</code> and B jumps <code>{f(abs(F(b_step)))}</code>, so <b>{bigger}</b> is bigger.",
    ))
N5_NEW.append(fam("L5NF6", "compare two steps", v))

# solo la direccion, con tipos mezclados
v = []
for start, step, mode in [(F(-7,1), 3, "int"), (F(15,10), F(-2,10), "dec"), (F(1,1), F(1,4), "frac"),
                          (-2, -4, "int"), (F(3,1), F(-1,3), "frac")]:
    f = FMT[mode]
    good = "counting on" if step > 0 else "counting back"
    v.append(mk(
        "Is this sequence counting on or counting back?",
        good,
        ["counting back" if step > 0 else "counting on", "neither: it repeats", "both at the same time"],
        "Look at whether the numbers get bigger or smaller from left to right.",
        f"Each jump is <code>{f(F(step))}</code>, so the numbers get {'bigger' if step > 0 else 'smaller'}.",
        seq=seq_of(start, step, 4, mode),
    ))
N5_NEW.append(fam("L5NF7", "direction only", v))

# paso a partir del 1.o y el 5.o termino
v = []
for start, step in [(3, 7), (100, -15), (12, 9), (45, -6), (8, 13)]:
    f = FMT["int"]
    fifth = F(start) + 4 * F(step)
    v.append(mk(
        f"The 1st term is {f(F(start))} and the 5th term is {f(fifth)}. What is the step?",
        f(F(step)),
        # Distractores = errores reales: quedarse con el cambio total, dividir
        # entre 5 posiciones en vez de 4 jumps, o perder la direccion.
        four_opts(f(F(step)), [f(abs(fifth - F(start))), f(F(step) + 1), f(-F(step))]),
        "From the 1st term to the 5th there are 4 jumps, not 5.",
        f"<code>{f(abs(fifth - F(start)))} / 4 = {f(abs(F(step)))}</code>, so the step is <code>{f(F(step))}</code>.",
    ))
N5_NEW.append(fam("L5NF8", "step from first and fifth", v))

# --- N7: invertir la regla (valor -> posicion) y pertenencia ------------------
N7_NEW = []
fi = FMT["int"]

# posicion de un valor en la tabla del k
v = []
for k, pos in [(8, 12), (7, 9), (6, 15), (9, 11), (4, 18)]:
    val = k * pos
    v.append(mk(
        f"The rule is: multiply the position by {k}. Which position has the value {val}?",
        fi(pos),
        four_opts(fi(pos), [fi(pos + 1), fi(pos - 1), fi(val - k)]),
        "Going backwards from a value undoes the rule: divide instead of multiply.",
        f"<code>{val} / {k} = {pos}</code>, so {val} is the {pos}th term.",
    ))
N7_NEW.append(fam("L7NF1", "position from value", v))

# pertenencia: division exacta o no
v = []
for k, val, yes in [(8, 50, False), (7, 63, True), (6, 40, False), (9, 72, True), (4, 30, False)]:
    good = "Yes" if yes else "No"
    q, r = divmod(val, k)
    v.append(mk(
        f"The rule is: multiply the position by {k}. Is {val} in this sequence?",
        good,
        ["No" if yes else "Yes", "Only if you count backwards", "There is not enough information"],
        f"Divide {val} by {k}. If it does not divide exactly, the value is not a term.",
        (f"<code>{val} / {k} = {q}</code> exactly, so {val} is the {q}th term."
         if yes else
         f"<code>{val} / {k} = {q}</code> remainder <code>{r}</code>. It does not divide exactly, so {val} is <b>not</b> a term."),
    ))
N7_NEW.append(fam("L7NF2", "is the value a term", v))

# cual de estos valores NO pertenece
v = []
for k, pos_list, bad in [(8, [3, 5, 7], 30), (6, [4, 6, 9], 40), (7, [2, 5, 8], 50), (9, [3, 4, 7], 40), (5, [3, 7, 11], 32)]:
    good = fi(bad)
    others = [fi(k * p) for p in pos_list]
    v.append(mk(
        f"The rule is: multiply the position by {k}. Which of these is <b>not</b> a term?",
        good,
        others,
        f"Try dividing each one by {k}. The odd one out leaves a remainder.",
        f"<code>{bad} / {k}</code> does not divide exactly. All the others do.",
    ))
N7_NEW.append(fam("L7NF3", "the odd value out", v))

# invertir una regla de dos pasos
v = []
for k, b, pos in [(3, 2, 7), (4, 1, 6), (5, 3, 8), (2, 5, 9), (6, 2, 5)]:
    val = k * pos + b
    v.append(mk(
        f"The rule is: multiply the position by {k}, then add {b}. Which position has the value {val}?",
        fi(pos),
        # El error tipico es dividir antes de quitar el +b, o quitarlo dos veces.
        four_opts(fi(pos), [fi((val - b) // k + 1), fi(pos - 1), fi(val - b), fi(val)]),
        f"Undo the rule in reverse order: take away {b} first, then divide by {k}.",
        f"<code>{val} - {b} = {k * pos}</code>, then <code>{k * pos} / {k} = {pos}</code>.",
    ))
N7_NEW.append(fam("L7NF4", "reverse a two-step rule", v))

# cuantos terminos hay por debajo de un tope
v = []
for k, cap in [(7, 100), (6, 50), (9, 100), (4, 30), (8, 90)]:
    n = (cap - 1) // k
    v.append(mk(
        f"The rule is: multiply the position by {k}. How many terms are smaller than {cap}?",
        fi(n),
        # Contar de mas (incluir el que ya pasa el tope), contar de menos, o
        # confundir "cuantos terminos" con "el valor del ultimo".
        four_opts(fi(n), [fi(n + 1), fi(n - 1), fi(k * n), fi(cap)]),
        f"Find the biggest multiple of {k} below {cap}, then say which position it is.",
        f"The last term below {cap} is <code>{k * n}</code>, which is the {n}th. So there are {n}.",
    ))
N7_NEW.append(fam("L7NF5", "how many terms below", v))

# el mayor termino por debajo de un tope
v = []
for k, cap in [(6, 50), (7, 60), (9, 80), (8, 70), (5, 43)]:
    n = (cap - 1) // k
    v.append(mk(
        f"The rule is: multiply the position by {k}. What is the largest term smaller than {cap}?",
        fi(k * n),
        four_opts(fi(k * n), [fi(k * (n + 1)), fi(k * (n - 1)), fi(cap - k)]),
        f"Count up in {k}s and stop before you pass {cap}.",
        f"<code>{k} x {n} = {k * n}</code> and <code>{k} x {n + 1} = {k * (n + 1)}</code>, which is too big.",
    ))
N7_NEW.append(fam("L7NF6", "largest term below", v))

# de valor a posicion, contando hacia atras (paso constante, no tabla)
v = []
for first, step, pos in [(5, 4, 8), (3, 6, 7), (10, 5, 9), (2, 7, 6), (6, 3, 11)]:
    val = first + (pos - 1) * step
    v.append(mk(
        f"A sequence starts at {first} and counts on in {step}s. Which position has the value {val}?",
        fi(pos),
        # El error de siempre: contar los saltos (pos-1) en vez de la posicion.
        four_opts(fi(pos), [fi(pos - 1), fi(pos + 1), fi((val - first) // step + 2), fi(val)]),
        "Take the first term away first, then see how many jumps fit.",
        f"<code>{val} - {first} = {val - first}</code>, and <code>{val - first} / {step} = {pos - 1}</code> jumps. "
        f"That is the <code>{pos}</code>th term, because the 1st term needs no jumps.",
    ))
N7_NEW.append(fam("L7NF7", "position in a step sequence", v))

# comparar dos posiciones
v = []
for k, v1, v2 in [(8, 96, 64), (6, 54, 72), (7, 49, 84), (9, 81, 63), (4, 48, 36)]:
    p1, p2 = v1 // k, v2 // k
    good = fi(max(v1, v2)) if (p1 > p2) == (v1 > v2) else fi(v1 if p1 > p2 else v2)
    good = fi(v1) if p1 > p2 else fi(v2)
    v.append(mk(
        f"The rule is: multiply the position by {k}. Which value comes <b>later</b> in the sequence?",
        good,
        [fi(v2) if p1 > p2 else fi(v1), "They are at the same position", "Neither is a term"],
        f"Divide both by {k}. The bigger position comes later.",
        f"<code>{v1} / {k} = {p1}</code> and <code>{v2} / {k} = {p2}</code>, so <code>{good}</code> comes later.",
    ))
N7_NEW.append(fam("L7NF8", "which value comes later", v))

# ---------------------------------------------------------------- jefes
# Regla dura (PLAN-V2 §0.5): un jefe evalua lo que su nivel NO evalua. Cada
# familia lleva `evaluates` y su `skill` no puede coincidir con ninguna del
# nivel; el generador lo comprueba abajo y falla si se rompe.
BOSSES = {}

def bfam(fid, skill, evaluates, variants):
    f = fam(fid, skill, variants)
    f["evaluates"] = evaluates
    return f

# --- JEFE 1: trabajar hacia atras (el nivel solo va hacia delante) -----------
B1 = []
v = []
for first, step, shown in [(4, 7, 3), (10, 6, 3), (3, 9, 3), (12, 5, 3), (7, 8, 3)]:
    f = FMT["int"]
    v.append(mk(
        "The start of the sequence was stolen. What was the first number?",
        f(F(first)),
        four_opts(f(F(first)), [f(F(first) + F(step)), f(F(first) - F(step)), f(F(first) + 1)]),
        "Go backwards: take the step away from the first number you can still see.",
        f"The step is <code>{f(F(step))}</code>. Going back from <code>{f(F(first)+F(step))}</code> gives <code>{f(F(first))}</code>.",
        seq=["?"] + [f(F(first) + i * F(step)) for i in range(1, shown + 1)],
    ))
B1.append(bfam("B1F1", "stolen first term", "inverse", v))

v = []
for first, step in [(60, -7), (40, -6), (85, -9), (33, -4), (52, -8)]:
    f = FMT["int"]
    v.append(mk(
        "This sequence counts back. What was the number before the first one you can see?",
        f(F(first) - F(step)),
        four_opts(f(F(first) - F(step)), [f(F(first) + F(step)), f(F(first)), f(F(first) - 2 * F(step))]),
        "To step backwards in a count-back sequence you have to ADD the step.",
        f"The sequence goes down by <code>{f(abs(F(step)))}</code>, so the number before <code>{f(F(first))}</code> is "
        f"<code>{f(F(first))} + {f(abs(F(step)))} = {f(F(first) - F(step))}</code>.",
        seq=["?"] + seq_of(first, step, 3, "int"),
    ))
B1.append(bfam("B1F2", "the term before", "inverse", v))

v = []
for first, step, n in [(5, 6, 4), (9, 7, 4), (2, 8, 4), (11, 4, 4), (6, 9, 4)]:
    f = FMT["int"]
    last = F(first) + (n - 1) * F(step)
    v.append(mk(
        f"The {n}th term is {f(last)} and the step is {f(F(step))}. What is the 1st term?",
        f(F(first)),
        four_opts(f(F(first)), [f(last - n * F(step)), f(F(first) + F(step)), f(last - F(step))]),
        f"From the 1st term to the {n}th there are {n-1} jumps. Take them all back off.",
        f"<code>{f(last)} - {n-1} x {f(F(step))} = {f(F(first))}</code>.",
    ))
B1.append(bfam("B1F3", "first term from the nth", "inverse", v))

v = []
for first, step in [(F(12,10), F(4,10)), (F(25,100), F(15,100)), (F(3,1), F(-3,10)), (F(45,10), F(-5,10)), (F(8,10), F(6,10))]:
    f = FMT["dec"]
    v.append(mk(
        "The start was rubbed out. What was the first number?",
        f(first),
        four_opts(f(first), [f(first + step), f(first - step), f(first + step * 2)]),
        "Find the step from the numbers you can see, then take one step backwards.",
        f"The step is <code>{f(step)}</code>, so before <code>{f(first + step)}</code> came <code>{f(first)}</code>.",
        seq=["?"] + [f(first + i * step) for i in range(1, 4)],
    ))
B1.append(bfam("B1F4", "stolen decimal start", "inverse", v))
BOSSES[1] = B1

# --- JEFE 2: pasos ocultos y cuenta de saltos (decimales) --------------------
B2 = []
v = []
for a, b, jumps in [(F(21,10), F(3,1), 3), (F(5,1), F(35,10), 3), (F(12,10), F(2,1), 4),
                    (F(75,100), F(1,1), 5), (F(4,1), F(3,1), 4)]:
    f = FMT["dec"]
    step = (b - a) / jumps
    v.append(mk(
        f"The tornado tore out the marks between {f(a)} and {f(b)}. There are {jumps} equal jumps. How big is each one?",
        f(abs(step)),
        four_opts(f(abs(step)), [f(abs(b - a)), f(abs(step) * 2), f(abs(step) / 2)]),
        f"Work out the whole distance first, then share it between the {jumps} jumps.",
        f"<code>{f(abs(b-a))} / {jumps} = {f(abs(step))}</code>.",
    ))
B2.append(bfam("B2F1", "step torn out", "inverse", v))

v = []
for a, b, step in [(F(21,10), F(3,1), F(3,10)), (F(1,1), F(2,1), F(2,10)), (F(5,1), F(4,1), F(-25,100)),
                   (F(3,1), F(45,10), F(5,10)), (F(6,1), F(51,10), F(-3,10))]:
    f = FMT["dec"]
    n = int(abs((b - a) / step))
    v.append(mk(
        f"How many jumps of {f(abs(step))} does it take to get from {f(a)} to {f(b)}?",
        fi(n),
        four_opts(fi(n), [fi(n + 1), fi(n - 1), fi(n * 2)]),
        "Distance first, then divide by the size of one jump.",
        f"<code>{f(abs(b-a))} / {f(abs(step))} = {n}</code> jumps.",
    ))
B2.append(bfam("B2F2", "count the jumps", "inverse", v))

# AUDITORIA: los pasos aqui son SIEMPRE positivos. Con un paso negativo,
# "3 jumps of 0.5 before 5" daba 6.5 como respuesta correcta: el nino lee
# "antes" y resta, y el enunciado nunca le dice en que direccion va la
# secuencia. Era una respuesta bien calculada a una pregunta ambigua.
v = []
for start, step, back in [(F(3,1), F(3,10), 3), (F(2,1), F(25,100), 4), (F(5,1), F(5,10), 3),
                          (F(18,10), F(2,10), 4), (F(4,1), F(3,10), 3)]:
    f = FMT["dec"]
    val = start - back * step
    v.append(mk(
        f"A mark sits at {f(start)}. Which value is {back} jumps of {f(step)} <b>before</b> it?",
        f(val),
        four_opts(f(val), [f(start + back * step), f(start - (back - 1) * step), f(start - (back + 1) * step)]),
        "Before means going backwards along the ruler: take the jumps off.",
        f"<code>{f(start)} - {back} x {f(step)} = {f(val)}</code>.",
    ))
B2.append(bfam("B2F3", "jumps before a mark", "inverse", v))

v = []
for a, b in [(F(27,10), F(3,1)), (F(19,10), F(21,10)), (F(45,10), F(5,1)), (F(88,100), F(1,1)), (F(35,10), F(4,1))]:
    f = FMT["dec"]
    n = int((b - a) / F(1,10))
    v.append(mk(
        f"How many tenths are there between {f(a)} and {f(b)}?",
        fi(n),
        four_opts(fi(n), [fi(n * 10), fi(n + 1), fi(n - 1)]),
        "One tenth is 0.1. Count how many of them fit in the gap.",
        f"<code>{f(b - a)}</code> is <code>{n}</code> lots of <code>0.1</code>.",
    ))
B2.append(bfam("B2F4", "how many tenths", "inverse", v))
BOSSES[2] = B2

# --- JEFE 3: saltos de 1/k y cruce de enteros -------------------------------
B3 = []
v = []
for a, b, k in [(F(1,1), F(3,1), 3), (F(2,1), F(4,1), 4), (F(1,2), F(2,1), 2),
                (F(3,1), F(1,1), 3), (F(1,1), F(5,2), 2)]:
    f = FMT["frac"]
    n = int(abs(b - a) * k)
    v.append(mk(
        f"How many planks of 1/{k} does it take to get from {f(a)} to {f(b)}?",
        fi(n),
        four_opts(fi(n), [fi(n + 1), fi(n - 1), fi(int(abs(b - a)))]),
        f"How far is it altogether? Then ask how many {'thirds' if k == 3 else 'quarters' if k == 4 else 'halves'} fit in that.",
        f"The distance is <code>{f(abs(b-a))}</code>, and that is <code>{n}</code> lots of <code>1/{k}</code>.",
    ))
B3.append(bfam("B3F1", "count the planks", "inverse", v))

v = []
# El punto de partida nunca cae a UN solo salto del entero: si no, el distractor
# "land - 1" vale 0 y se pisa con la respuesta. Ademas, a un salto la pregunta
# se contesta sin contar, que es justo lo que el jefe quiere que hagas.
for start, k, steps in [(F(1,3), 3, 5), (F(1,4), 4, 7), (F(1,2), 4, 6), (F(4,3), 3, 5), (F(5,4), 4, 7)]:
    f = FMT["frac"]
    # cual de los saltos cae justo en un entero
    land = None
    for i in range(1, steps + 1):
        if (start + i * F(1, k)).denominator == 1:
            land = i
            break
    assert land is not None
    v.append(mk(
        f"You start at {f(start)} and jump 1/{k} each time. On which jump do you land on a whole number?",
        fi(land),
        four_opts(fi(land), [fi(land + 1), fi(land + k), fi(max(1, land - 1))]),
        "Count along and watch for the moment the fraction part disappears.",
        f"After <code>{land}</code> jumps you are at <code>{f(start + land * F(1,k))}</code>, a whole number.",
    ))
B3.append(bfam("B3F2", "landing on a whole", "inverse", v))

v = []
for a, b, jumps in [(F(1,1), F(2,1), 3), (F(2,1), F(4,1), 4), (F(1,2), F(2,1), 3), (F(3,1), F(1,1), 4), (F(1,1), F(3,1), 4)]:
    f = FMT["frac"]
    step = (b - a) / jumps
    v.append(mk(
        f"The crab took the planks between {f(a)} and {f(b)}. There were {jumps} equal jumps. How long was each plank?",
        f(abs(step)),
        four_opts(f(abs(step)), [f(abs(b - a)), f(abs(step) * 2), f(abs(step) / 2)]),
        f"Share the whole distance between the {jumps} jumps.",
        f"<code>{f(abs(b-a))} / {jumps} = {f(abs(step))}</code>.",
    ))
B3.append(bfam("B3F3", "plank length", "inverse", v))

v = []
for whole, k in [(3, 3), (2, 4), (4, 2), (5, 3), (2, 5)]:
    f = FMT["frac"]
    v.append(mk(
        f"How many {'thirds' if k == 3 else 'quarters' if k == 4 else 'halves' if k == 2 else 'fifths'} are there in {whole}?",
        fi(whole * k),
        four_opts(fi(whole * k), [fi(whole + k), fi(whole * k - 1), fi(whole * k + k)]),
        f"Each whole is made of {k} of them.",
        f"<code>{whole} x {k} = {whole * k}</code>.",
    ))
B3.append(bfam("B3F4", "parts in a whole", "inverse", v))
BOSSES[3] = B3

# --- JEFE 4: distancia cruzando el cero, en los dos sentidos -----------------
B4 = []
v = []
for a, b, step in [(-7, 5, 4), (-9, 3, 4), (-6, 6, 3), (-10, 2, 6), (-5, 7, 4)]:
    d = b - a
    n = d // step
    assert d % step == 0
    v.append(mk(
        f"From floor {a} to floor {b}, in jumps of {step}. How many jumps?",
        fi(n),
        # Errores reales: contar el cero dos veces, quedarse corto, o restar
        # las distancias en vez de sumarlas al cruzar el cero.
        four_opts(fi(n), [fi(n + 1), fi(n - 1), fi(d), fi(abs(abs(b) - abs(a)))]),
        "Count the floors from the negative up to zero, then from zero up to the target.",
        f"From <code>{a}</code> to <code>0</code> is <code>{abs(a)}</code>, and <code>0</code> to <code>{b}</code> is <code>{b}</code>. "
        f"That is <code>{d}</code> altogether: <code>{d} / {step} = {n}</code> jumps.",
    ))
B4.append(bfam("B4F1", "jumps across zero", "distinguish", v))

v = []
for start, step, n in [(2, 3, 3), (5, 4, 3), (1, 5, 2), (4, 2, 4), (3, 6, 2)]:
    val = start - step * n
    v.append(mk(
        f"Which floor is {n} jumps of {step} <b>below</b> floor {start}?",
        fi(val),
        four_opts(fi(val), [fi(start + step * n), fi(val + step), fi(-(start + step * n))]),
        "Going below zero keeps counting: -1, -2, -3...",
        f"<code>{start} - {n} x {step} = {val}</code>.",
    ))
B4.append(bfam("B4F2", "floors below", "distinguish", v))

v = []
for a1, b1, a2, b2 in [(-3, 4, -5, 1), (-8, 2, -4, 5), (-6, 6, -2, 9), (-10, 1, -7, 3), (-2, 8, -9, 2)]:
    d1, d2 = b1 - a1, b2 - a2
    good = f"{a1} to {b1}" if d1 > d2 else f"{a2} to {b2}"
    other = f"{a2} to {b2}" if d1 > d2 else f"{a1} to {b1}"
    v.append(mk(
        f"Which is the longer trip: {a1} to {b1}, or {a2} to {b2}?",
        good,
        [other, "They are the same length", "You cannot compare them"],
        "Count each trip through zero, then compare the totals.",
        f"<code>{a1}</code> to <code>{b1}</code> is <code>{d1}</code>; <code>{a2}</code> to <code>{b2}</code> is <code>{d2}</code>.",
    ))
B4.append(bfam("B4F3", "longer trip", "distinguish", v))

v = []
for a, b in [(-7, 5), (-4, 9), (-12, 3), (-6, 2), (-9, 8)]:
    v.append(mk(
        f"How many floors are there between {a} and {b}?",
        fi(b - a),
        # Errores REALES: contar el cero dos veces, restar los tamanos en vez
        # de sumarlos, o quedarse solo con el lado negativo. Nada de relleno
        # absurdo: multiplicar |a| por |b| no es un error que nadie cometa.
        four_opts(fi(b - a), [fi(abs(a) + abs(b) + 1), fi(abs(abs(b) - abs(a))), fi(abs(a)), fi(abs(b))]),
        "Zero is a floor too, but it is not counted twice.",
        f"<code>{abs(a)}</code> floors up to zero, then <code>{b}</code> more: <code>{b - a}</code>.",
    ))
B4.append(bfam("B4F4", "floors between", "distinguish", v))
BOSSES[4] = B4

# --- JEFE 5: verificar (encontrar el termino falso) --------------------------
B5 = []
v = []
for start, step, bad_i, off in [(4, 7, 2, 1), (100, -25, 3, 5), (6, 9, 1, -2), (13, 6, 3, 3), (50, -8, 2, -4)]:
    f = FMT["int"]
    terms = [F(start) + i * F(step) for i in range(5)]
    good = f(terms[bad_i] + off)
    shown = [f(t) for t in terms]
    shown[bad_i] = good
    v.append(mk(
        f"This should count {'on' if step > 0 else 'back'} in {abs(step)}s, but the Mimic swapped one number. Which one is wrong?",
        good,
        four_opts(good, [shown[(bad_i + 1) % 5], shown[(bad_i + 2) % 5], shown[(bad_i + 3) % 5]]),
        "Check every jump, not just the first one. The wrong number breaks two jumps.",
        f"It should be <code>{f(terms[bad_i])}</code>, not <code>{good}</code>.",
        seq=shown,
    ))
B5.append(bfam("B5F1", "the impostor term", "verify", v))

v = []
for start, step, bad_i, off in [(F(21,10), F(3,10), 2, F(1,10)), (F(5,1), F(-5,10), 3, F(-2,10)),
                                (F(12,10), F(2,10), 1, F(3,10)), (F(4,1), F(-25,100), 2, F(1,10)),
                                (F(65,100), F(15,100), 3, F(-1,10))]:
    f = FMT["dec"]
    terms = [start + i * step for i in range(5)]
    good = f(terms[bad_i] + off)
    shown = [f(t) for t in terms]
    shown[bad_i] = good
    v.append(mk(
        "One decimal is wrong. Which one?",
        good,
        four_opts(good, [shown[(bad_i + 1) % 5], shown[(bad_i + 2) % 5], shown[(bad_i + 3) % 5]]),
        "Measure each jump. The odd one out will not match the rest.",
        f"It should be <code>{f(terms[bad_i])}</code>.",
        seq=shown,
    ))
B5.append(bfam("B5F2", "the wrong decimal", "verify", v))

# Se pregunta por la POSICION, no por el valor: al invertir un paso el numero
# falso coincide con uno anterior de la propia secuencia (9, 15, 21, 15, 33), y
# "cual es el 15 malo" no tiene respuesta unica.
ORD = ["1st", "2nd", "3rd", "4th", "5th"]
v = []
for start, step, bad in [(9, 6, 3), (40, -7, 3), (12, 8, 2), (55, -9, 3), (7, 11, 2)]:
    f = FMT["int"]
    terms = [F(start) + i * F(step) for i in range(5)]
    shown = [f(t) for t in terms]
    shown[bad] = f(terms[bad - 1] - F(step))     # va en la direccion contraria
    v.append(mk(
        "One number goes the wrong way. Which <b>position</b> is wrong?",
        ORD[bad],
        [o for o in ORD if o != ORD[bad]],
        "The wrong one does not have the wrong size: it goes backwards.",
        f"After <code>{f(terms[bad-1])}</code> the sequence should keep going "
        f"{'up' if step > 0 else 'down'} to <code>{f(terms[bad])}</code>, "
        f"but it goes back to <code>{shown[bad]}</code>.",
        seq=shown,
    ))
B5.append(bfam("B5F3", "the wrong direction", "verify", v))

v = []
for start, step in [(5, 5), (30, -6), (8, 7), (44, -4), (11, 9)]:
    f = FMT["int"]
    terms = [F(start) + i * F(step) for i in range(5)]
    good = "Yes, every jump is the same"
    v.append(mk(
        f"Is this a true sequence counting {'on' if step > 0 else 'back'} in {abs(step)}s?",
        good,
        ["No, one jump is too big", "No, one jump goes the wrong way", "No, the first number is wrong"],
        "Check all four jumps before you answer. Sometimes nothing is wrong.",
        f"Every jump is exactly <code>{f(F(step))}</code>, so the sequence is correct.",
        seq=[f(t) for t in terms],
    ))
B5.append(bfam("B5F4", "is the sequence true", "verify", v))
BOSSES[5] = B5

# --- JEFE 6: distinguir termino-a-termino de posicion-a-termino --------------
B6 = []
v = []
for k, n in [(8, 50), (6, 30), (7, 40), (9, 25), (4, 60)]:
    good = f"multiply the position by {k}"
    v.append(mk(
        f"Sequence: {k}, {2*k}, {3*k}, {4*k}<br>Which rule lets you find the {n}th term <b>without</b> writing them all out?",
        good,
        [f"add {k} to the term before", f"add {k} to the position", f"multiply the term before by {k}"],
        "One rule needs the term before it. The other only needs the position.",
        f"Adding {k} each time works, but you would need all {n} terms. "
        f"<code>{n} x {k} = {n*k}</code> gets there in one step.",
    ))
B6.append(bfam("B6F1", "which rule for a far term", "distinguish", v))

v = []
for k in [8, 6, 7, 9, 5]:
    good = f"add {k} to the term before"
    v.append(mk(
        f"Sequence: {k}, {2*k}, {3*k}, {4*k}<br>Which of these is the <b>term-to-term</b> rule?",
        good,
        [f"multiply the position by {k}", f"multiply the term before by {k}", f"add {k} to the position"],
        "Term-to-term means: what do I do to one term to get the next one?",
        f"Each term is <code>{k}</code> more than the one before, so the term-to-term rule is 'add {k}'.",
    ))
B6.append(bfam("B6F2", "name the term-to-term rule", "distinguish", v))

v = []
for k, n in [(8, 10), (6, 12), (7, 11), (9, 8), (4, 15)]:
    both = f"Both: they describe the same sequence"
    v.append(mk(
        f"'Add {k} to the term before' and 'multiply the position by {k}' describe the sequence "
        f"{k}, {2*k}, {3*k}, {4*k}. Which one is right?",
        both,
        ["Only 'add " + str(k) + " to the term before'",
         "Only 'multiply the position by " + str(k) + "'",
         "Neither is right"],
        "They are two ways of saying the same thing. One is quicker for far terms.",
        f"Both give <code>{k}, {2*k}, {3*k}, {4*k}</code>. The second one is faster when you need the {n}th term.",
    ))
B6.append(bfam("B6F3", "two mouths one sequence", "distinguish", v))

v = []
for k, b in [(3, 2), (4, 1), (5, 3), (6, 2), (2, 5)]:
    good = f"multiply the position by {k}, then add {b}"
    v.append(mk(
        f"Sequence: {k+b}, {2*k+b}, {3*k+b}, {4*k+b}<br>Which is the <b>position-to-term</b> rule?",
        good,
        [f"add {k} to the term before", f"multiply the position by {k+b}", f"add {k+b} to the position"],
        "The gap tells you what to multiply by. Then check what you still need to add.",
        f"The gap is <code>{k}</code>, so start with 'x {k}'. Position 1 gives <code>{k}</code>, but the term is "
        f"<code>{k+b}</code>, so also '+ {b}'.",
    ))
B6.append(bfam("B6F4", "spot the position-to-term rule", "distinguish", v))
BOSSES[6] = B6

# --- JEFE 7: combinar (tipo de regla, pertenencia, dos pasos encadenados) ----
B7 = []
v = []
for k, n in [(8, 10), (7, 12), (6, 15), (9, 9), (4, 20)]:
    v.append(mk(
        f"Sequence: {k}, {2*k}, {3*k}, {4*k}<br>Find the rule, then use it: what is the {n}th term?",
        fi(k * n),
        # Errores reales: una posicion de mas o de menos, sumar el paso al
        # ultimo termino visible, o sumar en vez de multiplicar.
        four_opts(fi(k * n), [fi(k * (n + 1)), fi(k * (n - 1)), fi(4 * k + k), fi(k + n)]),
        "Two steps: name the rule first, then apply it to the position.",
        f"The rule is 'multiply the position by {k}'. <code>{n} x {k} = {k*n}</code>.",
    ))
B7.append(bfam("B7F1", "find the rule then the term", "combine", v))

v = []
for k, val, yes in [(8, 50, False), (6, 54, True), (7, 60, False), (9, 90, True), (4, 38, False)]:
    good = "Yes" if yes else "No"
    q, r = divmod(val, k)
    v.append(mk(
        f"Sequence: {k}, {2*k}, {3*k}, {4*k}<br>Does {val} ever appear?",
        good,
        ["No" if yes else "Yes", "Only after the 100th term", "Only if you count backwards"],
        f"Find the rule, then divide {val} by it and see if it comes out exactly.",
        (f"<code>{val} / {k} = {q}</code> exactly: it is the {q}th term."
         if yes else f"<code>{val} / {k} = {q}</code> remainder <code>{r}</code>, so it never appears."),
    ))
B7.append(bfam("B7F2", "does it ever appear", "combine", v))

v = []
for first, step, val in [(5, 4, 33), (3, 6, 45), (10, 5, 50), (2, 7, 44), (6, 3, 30)]:
    pos = (val - first) // step + 1
    assert (val - first) % step == 0
    v.append(mk(
        f"A sequence starts at {first} and counts on in {step}s. Find the rule, then say which position holds {val}.",
        fi(pos),
        # El error de siempre: dar el numero de saltos (pos-1) como si fuera la posicion.
        four_opts(fi(pos), [fi(pos - 1), fi(pos + 1), fi(val - first), fi(val)]),
        "Take the first term off, divide by the step, then remember the 1st term needs no jumps.",
        f"<code>{val} - {first} = {val-first}</code>, <code>{val-first} / {step} = {pos-1}</code> jumps, so it is the "
        f"<code>{pos}</code>th term.",
    ))
B7.append(bfam("B7F3", "rule then position", "combine", v))

v = []
for start, step in [(4, -3), (7, -4), (10, -5), (5, -2), (9, -6)]:
    f = FMT["int"]
    hits = (start % abs(step) == 0)
    good = "Yes" if hits else "No"
    v.append(mk(
        f"Counting back from {start} in {abs(step)}s, do you ever land exactly on 0?",
        good,
        ["No" if hits else "Yes", "Only if you start again", "Zero is not a number in sequences"],
        f"Ask whether {start} divides exactly by {abs(step)}.",
        (f"<code>{start} / {abs(step)} = {start // abs(step)}</code> exactly, so you land on 0."
         if hits else
         f"<code>{start} / {abs(step)} = {start // abs(step)}</code> remainder <code>{start % abs(step)}</code>, "
         f"so you step over 0 to <code>{start - (start // abs(step) + 1) * abs(step)}</code>."),
    ))
B7.append(bfam("B7F4", "landing exactly on zero", "combine", v))
BOSSES[7] = B7

# ================================================================== ensamblado
# Cada nivel: una habilidad, 12 familias, una mecanica y un jefe.
# `mech` es la escena con la que se juega (PLAN-V2 §3.1). Hoy solo existe
# `doors`, que es el fallback; la Fase 5 construye las demas y el dato ya esta.

BOSS_TEXT = {
    1: dict(name="BACKTRACK BANDIT", hp=3, phases=1, mech="bridge",
            enter="A thief has been rubbing out the START of every sequence.",
            win="The Bandit drops the stolen numbers and runs.",
            lose="The Bandit shoves you out of the arena.",
            retry="He comes back with different numbers. The method is the same: work backwards."),
    2: dict(name="TENTH TWISTER", hp=3, phases=1, mech="ruler",
            enter="A tornado has torn the marks off the ruler.",
            win="The Twister blows itself out. The marks settle back.",
            lose="The Twister spins you off the wall.",
            retry="New gaps, same trick: find the whole distance, then share it."),
    3: dict(name="PLANK PINCHER", hp=4, phases=2, mech="planks",
            enter="A crab is stealing planks from the ford.",
            win="The Pincher scuttles away and drops the planks.",
            lose="The Pincher tips you into the water.",
            retry="Different planks this time. Count how many fit."),
    4: dict(name="ZERO WARDEN", hp=4, phases=2, mech="lift",
            enter="The Warden guards floor 0 and will not let you pass.",
            win="The Warden steps aside. Floor 0 is yours.",
            lose="The Warden sends you back up the shaft.",
            retry="New floors. Remember: count up to zero, then up from zero."),
    5: dict(name="THE MIMIC", hp=4, phases=2, mech="smash",
            enter="Something is copying the sequence and slipping in a lie.",
            win="The Mimic loses its shape and vanishes.",
            lose="The Mimic tricks you one time too many.",
            retry="It will hide the lie somewhere else. Check every jump."),
    6: dict(name="TERM TITAN", hp=4, phases=2, mech="machine",
            enter="A giant with two mouths: one says 'add', the other says 'multiply'.",
            win="The Titan closes both mouths and steps back.",
            lose="The Titan talks over you and you lose your place.",
            retry="Same two mouths. Ask which one gets you there fastest."),
    7: dict(name="SEQUENCE SOVEREIGN", hp=5, phases=3, mech="machine",
            enter="The Sovereign rules every sequence you have met so far.",
            win="The Sovereign bows. You have the run of the whole tower.",
            lose="The Sovereign dismisses you from the throne room.",
            retry="The crown does not change. Find the rule, then use it."),
}

SPEC = [
    # (id, nombre, subtitulo, habilidad, mech, familias)
    (1, "STEP COUNTER", "Counting on and back with whole numbers", "apply a whole-number step", "bridge",
     take("L1F1", "L1F2", "L1F4", "L1F6", "L1F7", "L1F9", "L1F10", "L1F11", "L1F12", "L1F14", "L1F16") + N1_NEW),
    (2, "TENTHS TRAIL", "Counting on and back in decimal steps", "apply a decimal step", "ruler",
     take("L2F1", "L2F2", "L2F3", "L2F5", "L2F6", "L2F7", "L2F8", "L2F9", "L2F10", "L2F13", "L2F14", "L2F16")),
    (3, "FRACTION FORD", "Counting in fraction steps, past the whole numbers", "apply a fraction step", "planks",
     take("L3F1", "L3F2", "L3F4", "L3F5", "L3F6", "L3F7", "L3F8", "L3F9", "L3F10", "L3F11", "L3F12", "L3F13")),
    (4, "BELOW ZERO", "Counting through zero into negative numbers", "apply a step across zero", "lift",
     take("L4F1", "L4F2", "L4F3", "L4F4", "L4F7", "L4F8", "L4F9", "L4F11", "L4F13", "L4F14", "L4F15", "L4F16")),
    (5, "PATTERN DETECTIVE", "Working out the step and the direction yourself", "find the step and direction", "rule",
     take("L1F3", "L1F13", "L2F4", "L3F3") + N5_NEW),
    (6, "RULE MACHINE", "Position-to-term rules: jump straight to any term", "position to term", "machine",
     take("L5F1", "L5F2", "L5F4", "L5F5", "L5F8", "L5F9", "L5F10", "L5F11", "L5F12", "L5F13", "L5F15", "L5F16")),
    (7, "REVERSE ENGINE", "Running the rule backwards: from a value to its position", "term to position", "machine",
     take("L5F3", "L5F6", "L5F7", "L5F14") + N7_NEW),
]

BRIEFINGS = {
    1: LEVELS[0]["briefing"], 2: LEVELS[1]["briefing"], 3: LEVELS[2]["briefing"],
    4: LEVELS[3]["briefing"], 6: LEVELS[4]["briefing"],
}
BRIEFINGS[5] = [
    "<p>So far the step was given to you. From here you have to <b>find it yourself</b>.</p>",
    "<p>Two things to work out, and they are separate:</p>",
    "<ul><li><b>The direction.</b> Do the numbers get bigger (count on) or smaller (count back)?</li>"
    "<li><b>The size of the step.</b> Take one term away from the one before it.</li></ul>",
    "<div class='example'>7.5, 7.2, 6.9<br>7.5 - 7.2 = 0.3 and the numbers shrink<br>Rule: count back in 0.3s</div>",
    "<p>If terms are missing in the middle, find the <b>whole</b> change first and share it between the jumps:</p>",
    "<div class='example'>2.1, ?, ?, 3.0<br>Change: 3.0 - 2.1 = 0.9<br>Jumps: 3<br>0.9 / 3 = 0.3</div>",
    "<p class='text-dim'>Always check <i>two</i> jumps before you decide. One jump can fool you.</p>",
]
BRIEFINGS[7] = [
    "<p>The rule takes a <b>position</b> and gives you a <b>term</b>. Now run it backwards.</p>",
    "<div class='example'>Rule: multiply the position by 8<br>Forwards: 12th term = 12 x 8 = 96<br>"
    "Backwards: 96 is at position 96 / 8 = 12</div>",
    "<p>Doing the opposite of the rule means <b>dividing</b> instead of multiplying.</p>",
    "<p>For a two-step rule, undo the steps in reverse order:</p>",
    "<div class='example'>Rule: multiply by 3, then add 2<br>Value 23: first 23 - 2 = 21, then 21 / 3 = 7<br>"
    "So 23 is the 7th term.</div>",
    "<p>And the question that catches everyone: <b>does this value belong at all?</b> "
    "If the division does not come out exactly, the answer is no.</p>",
    "<div class='example'>Is 50 in the 8 times table?<br>50 / 8 = 6 remainder 2<br>No: 50 is not a term.</div>",
]

# Una habilidad no puede vivir en dos niveles: la medalla mezclaria enteros con
# decimales, y la barra de progreso daria por aprendida en el nivel 2 una
# familia que solo se acerto en el nivel 1. Se cualifican por tipo de numero.
SKILL_FIX = {
    "L2F10": "fill two decimal gaps",
    "L3F13": "fill two fraction gaps",
    "L4F16": "crossing zero backwards",
}

LEVELS = []
for lid, name, subtitle, skill, mech, fams in SPEC:
    fams = [dict(f) for f in fams]
    for f in fams:
        f["mech"] = mech
        if f["id"] in SKILL_FIX:
            f["skill"] = SKILL_FIX[f["id"]]
    bt = BOSS_TEXT[lid]
    rounds = [dict(b) for b in BOSSES[lid]]
    for r in rounds:
        r["mech"] = bt["mech"]
    LEVELS.append({
        "id": lid,
        "name": name,
        "subtitle": subtitle,
        "skill": skill,
        "mech": mech,
        "briefing": BRIEFINGS[lid],
        "questions": fams,
        "boss": {
            "name": bt["name"], "hp": bt["hp"], "phases": bt["phases"], "shields": 3, "mercy": 2,
            "mech": bt["mech"], "enter": bt["enter"], "win": bt["win"],
            "lose": bt["lose"], "retry": bt["retry"],
            "rounds": rounds,
        },
    })

# ---------------------------------------------------------------- lugares
# Cada nivel es un LUGAR (PLAN-AMBIENTES.md). Aqui se declara con props de
# assets/props.js, materiales y una paleta. El motor no conoce "castillo" ni
# "bosque": solo pinta lo que este bloque dice. Un solo mundo coherente:
# puente del castillo -> muralla -> vado del bosque -> mazmorra -> taller.
#
# Tokens: sky/sky2 cielo, far siluetas, wall/floor tinte de material,
# prop/prop2 cuerpos, glow/glow2 luz, line bordes, slot/slotline casillas.
# Texto blanco #eaf0ff sobre `slot`: contraste verificado >= 8:1 en los cinco.
ENVS = {
    1: {  # puente de piedra sobre el foso, de noche
        "palette": {"sky": "#4a3f6a", "sky2": "#6f5f8c", "far": "#3a3050",
        "wall": "#8a7a9a", "floor": "#6a5f7e", "prop": "#6b4a2c",
        "prop2": "#a898b8", "glow": "#ffb347", "glow2": "#ffe08a",
        "line": "#2a2038", "slot": "#3a2a1f", "slotline": "#e0a45a"},
        # Donde va cada cosa (visto en vivo):
        #   far  -> se apoya en la linea alta del muro y asoma contra el cielo (64px)
        #   wall y:top top:0 -> franja alta de pared, ENCIMA de las puertas (34px)
        #   fg   -> sobre el suelo, delante del muro, detras del heroe (78px)
        # Nada con bottom en `wall`: caeria detras de las puertas y no se veria.
        "materials": {"wall": "brick", "floor": "flag"},
        "far":  [{"prop": "tower", "x": 8, "scale": 0.6}, {"prop": "tower", "x": 34, "scale": 0.45},
                 {"prop": "tower", "x": 60, "scale": 0.55}],
        "wall": [{"prop": "merlon", "repeat": 8, "y": "top", "top": 0},
                 {"prop": "torch", "x": 12, "y": "top", "top": 0, "scale": 0.45},
                 {"prop": "window", "x": 50, "y": "top", "top": 0, "scale": 0.6},
                 {"prop": "torch", "x": 88, "y": "top", "top": 0, "scale": 0.45}],
        "gate": "gate",
        "transition": "slide",
    },
    2: {  # adarve de la muralla, de dia
        "palette": {"sky": "#4f86cf", "sky2": "#a9c8f0", "far": "#5c6f9c",
        "wall": "#b0b4c4", "floor": "#8f93a4", "prop": "#6b4a2c",
        "prop2": "#c8ccd8", "glow": "#ffe08a", "glow2": "#ffffff",
        "line": "#3f4a66", "slot": "#3f3f52", "slotline": "#d8dce8"},
        "materials": {"wall": "stone", "floor": "flag"},
        "far":  [{"prop": "tower", "x": 12, "scale": 0.5}, {"prop": "treefar", "x": 40, "scale": 0.6},
                 {"prop": "treefar", "x": 50, "scale": 0.8}, {"prop": "tower", "x": 72, "scale": 0.4}],
        "wall": [{"prop": "merlon", "repeat": 9, "y": "top", "top": 0},
                 {"prop": "window", "x": 30, "y": "top", "top": 0, "scale": 0.6},
                 {"prop": "window", "x": 70, "y": "top", "top": 0, "scale": 0.6}],
        "gate": "gate",
        "transition": "slide",
    },
    3: {  # vado del rio en el bosque
        "palette": {"sky": "#2f6a44", "sky2": "#5aa06a", "far": "#245c38",
        "wall": "#4a8a58", "floor": "#6a9a52", "prop": "#6a4a2a",
        "prop2": "#7ab86a", "glow": "#d8ff8c", "glow2": "#f2ffd0",
        "line": "#2c5a38", "slot": "#3b2412", "slotline": "#c99a5b"},
        "materials": {"wall": "leaves", "floor": "grass"},
        "far":  [{"prop": "treefar", "x": 6, "scale": 0.9}, {"prop": "treefar", "x": 20, "scale": 0.7},
                 {"prop": "tree", "x": 32, "scale": 0.7}, {"prop": "treefar", "x": 64, "scale": 0.8},
                 {"prop": "tree", "x": 76, "scale": 0.65}],
        "wall": [],
        "fg":   [{"prop": "bush", "x": 5}, {"prop": "reeds", "x": 38}, {"prop": "reeds", "x": 62},
                 {"prop": "bush", "x": 94, "scale": 0.9}],
        "gate": "gate",
        "transition": "slide",
    },
    4: {  # mazmorra bajo la torre: roca, cristales, luz fria
        "palette": {"sky": "#38506a", "sky2": "#5f7f9e", "far": "#2c4358",
        "wall": "#6a8298", "floor": "#56708a", "prop": "#5a6a7a",
        "prop2": "#8aa2b8", "glow": "#7ee8fa", "glow2": "#d8f6ff",
        "line": "#22303e", "slot": "#22303e", "slotline": "#9fe0ff"},
        "materials": {"wall": "rock", "floor": "rock"},
        "far":  [{"prop": "stalac", "repeat": 6, "y": "top", "top": 0}],
        "wall": [{"prop": "torch", "x": 50, "y": "top", "top": 0, "scale": 0.45}],
        "fg":   [{"prop": "crystal", "x": 12}, {"prop": "crystal", "x": 52, "scale": 0.8},
                 {"prop": "crystal", "x": 86, "scale": 1.1}],
        "gate": "gate",
        "transition": "slide",
    },
    5: {  # sala de compuertas de la presa: palancas en muro de piedra
        "palette": {"sky": "#3a5f80", "sky2": "#6e93b0", "far": "#2e4c66",
        "wall": "#8a9aa6", "floor": "#6e8290", "prop": "#5a4a3a",
        "prop2": "#a8b6c0", "glow": "#9fe8ff", "glow2": "#e0f6ff",
        "line": "#2a3a44", "slot": "#2a3a44", "slotline": "#9fd0e0"},
        "materials": {"wall": "stone", "floor": "metal"},
        "far":  [{"prop": "tower", "x": 14, "scale": 0.5}, {"prop": "tower", "x": 80, "scale": 0.45}],
        "wall": [{"prop": "lamp", "x": 20, "y": "top", "top": 0, "scale": 0.5},
                 {"prop": "lamp", "x": 80, "y": "top", "top": 0, "scale": 0.5}],
        "fg":   [{"prop": "gear", "x": 8, "scale": 0.7}, {"prop": "gear", "x": 92, "scale": 0.7}],
        "gate": "gate",
        "transition": "slide",
    },
    6: {  # taller de maquinas en lo alto de la torre
        "palette": {"sky": "#6a4a20", "sky2": "#9a7038", "far": "#563a18",
        "wall": "#b08a4a", "floor": "#8a6a3a", "prop": "#4a3418",
        "prop2": "#d8a85a", "glow": "#ffd93d", "glow2": "#fff2b0",
        "line": "#3e2c10", "slot": "#3e2c10", "slotline": "#ffd93d"},
        "materials": {"wall": "metal", "floor": "plank"},
        "far":  [{"prop": "gear", "x": 15, "y": "top", "top": 6, "scale": 1.2},
                 {"prop": "gear", "x": 78, "y": "top", "top": 2, "scale": 0.9}],
        "wall": [{"prop": "lamp", "x": 25, "y": "top", "top": 0, "scale": 0.55},
                 {"prop": "lamp", "x": 75, "y": "top", "top": 0, "scale": 0.55}],
        "fg":   [{"prop": "gear", "x": 50, "scale": 0.9}],
        "gate": "gate",
        "transition": "slide",
    },
    7: {  # el MISMO taller, apagado y en rojo: la maquina al reves
        "palette": {"sky": "#5a2a2a", "sky2": "#9a5a52", "far": "#4a2422",
        "wall": "#a06058", "floor": "#7a4a42", "prop": "#3a221e",
        "prop2": "#c08078", "glow": "#ff8a70", "glow2": "#ffc0b0",
        "line": "#2e1a16", "slot": "#2e1a16", "slotline": "#ff9a80"},
        "materials": {"wall": "metal", "floor": "plank"},
        "far":  [{"prop": "gear", "x": 15, "y": "top", "top": 6, "scale": 1.2},
                 {"prop": "gear", "x": 78, "y": "top", "top": 2, "scale": 0.9}],
        "wall": [{"prop": "lamp", "x": 25, "y": "top", "top": 0, "scale": 0.55},
                 {"prop": "lamp", "x": 75, "y": "top", "top": 0, "scale": 0.55}],
        "fg":   [{"prop": "gear", "x": 50, "scale": 0.9}],
        "gate": "gate",
        "transition": "slide",
    },
}
for _lv in LEVELS:
    _lv["env"] = ENVS[_lv["id"]]

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

# ---------------------------------------------------------------- validaciones
# Escribir cientos de preguntas a mano garantiza errores, y una respuesta mal
# marcada le ensena algo falso a 25 ninos. Estas comprobaciones son el ultimo
# filtro automatico; la auditoria humana leyendo una muestra sigue siendo
# obligatoria (no hay assert que detecte un submarino que sube sobre el mar).
assert len(DATA["levels"]) == 7, len(DATA["levels"])

MECHS = {"doors", "bridge", "ruler", "planks", "lift", "rule", "machine", "smash"}
EVALS = {"inverse", "verify", "distinguish", "combine"}
_ids, _n_fam, _n_var = set(), 0, 0

def check_variants(q, where):
    global _n_var
    assert len(q["variants"]) >= 5, (where, q["id"], len(q["variants"]))
    for var in q["variants"]:
        _n_var += 1
        assert len(var["options"]) == 4, (where, q["id"])
        assert len(set(var["options"])) == 4, (where, q["id"], var["options"])
        assert 0 <= var["answer"] < 4, (where, q["id"])
        assert var["options"][var["answer"]] is not None, (where, q["id"])
        for o in var["options"]:
            assert str(o).strip() != "", (where, q["id"], "opcion vacia")
        assert var["hint"] and var["explain"], (where, q["id"], "sin pista o sin explicacion")

for lv in DATA["levels"]:
    L = lv["id"]
    assert lv["mech"] in MECHS, (L, lv["mech"])
    assert len(lv["questions"]) == 12, (L, "familias", len(lv["questions"]))
    assert lv["briefing"], (L, "sin briefing")
    for q in lv["questions"]:
        assert q["id"] not in _ids, ("id repetido", q["id"])
        _ids.add(q["id"]); _n_fam += 1
        assert q["mech"] == lv["mech"], (L, q["id"])
        check_variants(q, "nivel %d" % L)

    b = lv["boss"]
    assert b["name"] and b["enter"] and b["win"] and b["lose"] and b["retry"], (L, "jefe sin textos")
    assert 3 <= b["hp"] <= 5 and 1 <= b["phases"] <= 3, (L, b["hp"], b["phases"])
    assert b["mech"] in MECHS, (L, b["mech"])
    assert 4 <= len(b["rounds"]) <= 5, (L, "rondas", len(b["rounds"]))

    # LA regla del jefe: evalua lo que el nivel NO evalua.
    level_skills = {q["skill"] for q in lv["questions"]}
    for r in b["rounds"]:
        assert r["id"] not in _ids, ("id repetido", r["id"])
        _ids.add(r["id"]); _n_fam += 1
        assert r.get("evaluates") in EVALS, (L, r["id"], r.get("evaluates"))
        assert r["skill"] not in level_skills, (
            "El jefe %d repite la habilidad '%s' que ya evalua su nivel" % (L, r["skill"]))
        check_variants(r, "jefe %d" % L)

# Ninguna habilidad puede aparecer en dos niveles: si pasa, el reparto por
# habilidad no se sostiene y las medallas cuentan dos cosas distintas juntas.
_seen_skill = {}
for lv in DATA["levels"]:
    for q in lv["questions"]:
        prev = _seen_skill.get(q["skill"])
        assert prev is None, ("habilidad '%s' en los niveles %s y %s" % (q["skill"], prev, lv["id"]))
        _seen_skill[q["skill"]] = lv["id"]

# Cada nivel es un lugar distinto.
_skies = [lv["env"]["palette"]["sky"] for lv in DATA["levels"]]
assert len(set(_skies)) >= 6, "hay niveles con el mismo cielo: no se distinguen como lugares"
for lv in DATA["levels"]:
    for o in lv["env"].get("wall", []):
        assert o.get("y") == "top", (lv["id"], "prop de pared apoyado en el suelo: caeria tras las puertas")

import os, sys
# Por defecto, la carpeta de ESTA materia. Antes el defecto era "." y ejecutarlo
# sin argumentos dejaba un data.js suelto en la raiz del repo mientras el juego
# seguia usando el viejo: parecia que el generador no habia hecho nada.
_here = os.path.dirname(os.path.abspath(__file__))
_default_out = os.path.join(os.path.dirname(_here), "subjects", "y6-maths-counting-sequences")
out_dir = sys.argv[1] if len(sys.argv) > 1 else _default_out
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
