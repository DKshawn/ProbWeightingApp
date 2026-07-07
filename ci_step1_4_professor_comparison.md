# CI Step1-4: current code vs professor upstream

This note compares the current CI-module Step1-4 design with the professor upstream code.

- Current code: `master` at `1756998`
- Professor upstream code: `upstream/master` at `d7285ad`
- Main files:
  - `backend/trial_generator.py`
  - `frontend/src/components/Step1Screen.jsx`
  - `frontend/src/components/Step2Screen.jsx`
  - `frontend/src/components/Step3Screen.jsx`
  - `frontend/src/components/Step4Screen.jsx`
  - `frontend/src/hooks/useSession.js`

## Notation

Let

$$
L(a,z)
$$

mean a lottery that pays amount $z$ with objective probability $a$, and pays $0$ otherwise.

Under rank-dependent / prospect-theory style notation, indifference between two one-nonzero-outcome lotteries is written as

$$
w(a)u(z)=w(b)u(z').
$$

The generated parameters are:

- $p,q,r$: objective probabilities.
- $x,x'$: money amounts.
- $y$: amount elicited in Step 1.
- $s$: probability elicited in Step 2.
- $y'$: amount elicited in Step 3.
- $N$: compound level, currently $N=2$ or $N=3$.

In the Step1-3 formulas below, underlined variables are the values entered by the participant in that step.

## Summary of the most important change

The key mathematical fix is in Step 2.

Professor upstream Step 2 used:

$$
L(p,x) \sim L(\underline{s},y).
$$

Our current code uses:

$$
L(r,x) \sim L(\underline{s},y).
$$

This matters because Step 1 already uses $L(p,x)$. If Step 2 also uses $L(p,x)$, then Step 1 and Step 2 imply $s=q$ under exact consistency, and the independently generated $r$ is not linked to $p,q,s$ before Step 4. But Step 4 tests $r^N$ against $s^N$, so the original Step 2 did not construct the intended CI comparison.

With the current Step 2, the design constructs:

$$
\frac{w(p)}{w(q)}=\frac{w(r)}{w(\underline{s})}.
$$

Then Step 3 and Step 4 test whether this ratio relation is preserved after compounding by $N$.

Important clarification: in professor upstream, $r$ does exist in the generated trial object, but it is not used in Step 1, Step 2, or Step 3. It first appears in Step 4. That is exactly why the upstream chain is internally inconsistent for the intended CI test.

Professor upstream code evidence:

- `backend/trial_generator.py`: generates `r` and returns it in each trial.
- `frontend/src/components/Step2Screen.jsx`: destructures `{ p, x, N, block }` and displays probability `p`; it does not use `r`.
- `frontend/src/components/Step4Screen.jsx`: destructures `{ r, x_prime, N, block }`, computes `rN = (r ** N)`, and displays the lottery with probability `rN`.

## Step-by-step comparison

| Step | Professor upstream formula | Current formula | Main difference |
|---|---|---|---|
| Step 1 | $L(p,x)\sim L(q,\underline{y})$ | $L(p,x)\sim L(q,\underline{y})$ | Same formula. Current code adds monotonicity validation for $y$. |
| Step 2 | $L(p,x)\sim L(\underline{s},y)$ | $L(r,x)\sim L(\underline{s},y)$ | Changed $p$ to $r$. This is the main mathematical correction. Current code also adds monotonicity validation for $s$. |
| Step 3 | $L(p^N,x')\sim L(q^N,\underline{y'})$ | $L(p^N,x')\sim L(q^N,\underline{y'})$ | Same formula. Current code adds monotonicity validation for $y'$. |
| Step 4 | Compare $L(r^N,x')$ with $L(s^N,y')$ | Compare $L(r^N,x')$ with $L(s^N,y')$ | The displayed Step4 comparison is the same, but in upstream this is the first place where $r$ affects the participant-facing task. Current code adds double-submit protection and response-time recording. |

## Professor upstream mathematical chain

### Step 1

Professor upstream:

$$
L(p,x) \sim L(q,\underline{y})
$$

so

$$
w(p)u(x)=w(q)u(\underline{y}).
$$

This implies

$$
\frac{u(\underline{y})}{u(x)}=\frac{w(p)}{w(q)}.
$$

### Step 2

Professor upstream:

$$
L(p,x) \sim L(\underline{s},y)
$$

so

$$
w(p)u(x)=w(\underline{s})u(y).
$$

Using Step 1, this gives:

$$
w(q)u(y)=w(\underline{s})u(y).
$$

If $u(y)>0$, then:

$$
w(q)=w(\underline{s}).
$$

If $w$ is monotone, then:

$$
\underline{s}=q.
$$

Thus, in the upstream design, Step 2 does not use $r$ to construct a new ratio. It mostly re-elicits something equivalent to $q$.

### Step 3

Professor upstream:

$$
L(p^N,x') \sim L(q^N,\underline{y'})
$$

so

$$
w(p^N)u(x')=w(q^N)u(\underline{y'}).
$$

This implies

$$
\frac{u(\underline{y'})}{u(x')}=\frac{w(p^N)}{w(q^N)}.
$$

### Step 4

Professor upstream compares:

$$
X=L(r^N,x')
$$

with

$$
Y=L(s^N,y').
$$

That is,

$$
w(r^N)u(x') \quad \text{vs.} \quad w(s^N)u(y').
$$

Problem: because upstream Step 1-3 did not use $r$, the pair $(r,s)$ was not constructed to match the ratio $(p,q)$. So Step 4 suddenly introduces $r^N$, but there is no previous elicitation step that makes $r$ and $s$ comparable to $p$ and $q$. This is the specific upstream design problem.

## Current mathematical chain

### Step 1

Current code:

$$
L(p,x) \sim L(q,\underline{y})
$$

so

$$
w(p)u(x)=w(q)u(\underline{y}).
$$

This implies:

$$
\frac{u(\underline{y})}{u(x)}=\frac{w(p)}{w(q)}.
$$

Code location:

- `frontend/src/components/Step1Screen.jsx`

Additional validation:

- If $p>q$, then $\underline{y}$ should not be smaller than $x$.
- If $p<q$, then $\underline{y}$ should not be larger than $x$.

Because the generator currently enforces $p>q$, the practically relevant restriction is:

$$
\underline{y}\ge x.
$$

### Step 2

Current code:

$$
L(r,x) \sim L(\underline{s},y)
$$

so

$$
w(r)u(x)=w(\underline{s})u(y).
$$

This implies:

$$
\frac{u(y)}{u(x)}=\frac{w(r)}{w(\underline{s})}.
$$

Combining with Step 1:

$$
\frac{w(p)}{w(q)}=\frac{w(r)}{w(\underline{s})}.
$$

Code location:

- `frontend/src/components/Step2Screen.jsx`

This is the main correction from professor upstream. The code change was introduced in commit:

- `5c96db8 Add Vercel Neon persistence`

Additional validation:

- If $x>y$, then $\underline{s}$ should not be smaller than $r$.
- If $x<y$, then $\underline{s}$ should not be larger than $r$.

In formula form:

$$
x>y \Rightarrow \underline{s}\ge r,
$$

$$
x<y \Rightarrow \underline{s}\le r.
$$

These direction checks were added in commit:

- `4db7612 Validate indifference input directions`

### Step 3

Current code:

$$
L(p^N,x') \sim L(q^N,\underline{y'})
$$

so

$$
w(p^N)u(x')=w(q^N)u(\underline{y'}).
$$

This implies:

$$
\frac{u(\underline{y'})}{u(x')}=\frac{w(p^N)}{w(q^N)}.
$$

Code location:

- `frontend/src/components/Step3Screen.jsx`

Additional validation:

- If $p^N>q^N$, then $\underline{y'}$ should not be smaller than $x'$.
- If $p^N<q^N$, then $\underline{y'}$ should not be larger than $x'$.

Because the generator currently enforces $p>q$, the practically relevant restriction is:

$$
\underline{y'}\ge x'.
$$

These direction checks were also added in commit:

- `4db7612 Validate indifference input directions`

### Step 4

Current code compares:

$$
X=L(r^N,x')
$$

and

$$
Y=L(s^N,y').
$$

That is:

$$
w(r^N)u(x') \quad \text{vs.} \quad w(s^N)u(y').
$$

The app records CI as satisfied when the participant chooses:

```text
ほとんど無差別
```

Mathematically, Step 4 indifference means:

$$
w(r^N)u(x')=w(s^N)u(y').
$$

Equivalently:

$$
\frac{u(y')}{u(x')}=\frac{w(r^N)}{w(s^N)}.
$$

From Step 3:

$$
\frac{u(y')}{u(x')}=\frac{w(p^N)}{w(q^N)}.
$$

Therefore Step 4 tests whether:

$$
\frac{w(p^N)}{w(q^N)}=\frac{w(r^N)}{w(s^N)}.
$$

Given Step 1 and Step 2 constructed:

$$
\frac{w(p)}{w(q)}=\frac{w(r)}{w(s)},
$$

Step 4 is the actual Compound Invariance check.

Code location:

- `frontend/src/components/Step4Screen.jsx`
- `frontend/src/hooks/useSession.js`

## Trial-generation differences that affect Step1-4 stimuli

Professor upstream generated:

- 20 CI trials total.
- 10 trials with $N=2$.
- 10 trials with $N=3$.
- No amount-level treatment.
- Amounts $x,x'$ were sampled from 10 to 100 yen.

Current code generates:

- 5 CI trials total.
- Pilot mode: fixed $N=2$.
- Full mode: each participant is assigned either $N=2$ or $N=3$, based on student ID.
- CI amount level:
  - odd last digit: low amount, multiplier $1$.
  - even last digit: high amount, multiplier $100$.
- Amounts $x,x'$ are sampled from 10 to 100 and then multiplied by the assigned multiplier.

Code location:

- `backend/trial_generator.py`

These changes affect the displayed values, but the main mathematical correction to Step1-4 is still Step 2: $p$ was replaced by $r$.

## Current rule

The generator now rejects cases where $r=p$ or $r=q$, because those cases make Step 2 or Step 4 visually too close to the Step 1/3 comparison and can feel repetitive to testers. The CI trial generation rule is:

$$
r\ne p,\quad r\ne q.
$$

That would be a design cleanup, not the original Step2 correction.

## Bottom line

The forgotten correction was:

1. Step 2 was changed from

$$
L(p,x)\sim L(\underline{s},y)
$$

to

$$
L(r,x)\sim L(\underline{s},y).
$$

2. Direction checks were added so Step 1, Step 2, and Step 3 do not accept choices that violate basic monotonicity.

3. Step 4's mathematical comparison did not change; it was already comparing $L(r^N,x')$ and $L(s^N,y')$. The problem was that professor upstream Step 2 did not correctly construct $s$ relative to $r$.
