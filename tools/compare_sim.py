# Does taking less damage beat dealing more? Compare section's default teams on Diego/Ava/Luna, PvP.
# Same Frakinator simplified formula as tools/kill_sim.py. k is a placeholder, so round counts are not calibrated.
from math import sqrt
def fight(off, dfn, eo, ed, N=100000, E=100000, k=0.01, cap=10**6):
    n, e, r = float(N), float(E), 0
    while n > 0 and e > 0 and r < cap:
        m = min(n, e); ke = k*sqrt(n)*sqrt(m)*off/ed; kn = k*sqrt(e)*sqrt(m)*eo/dfn
        n, e = max(n-kn, 0), max(e-ke, 0); r += 1
    return r, n/N, 1-e/E
A = (1.610, 1.605); B = (1.867, 1.0)   # (damage dealt, damage taken divisor)
print("Fight until one side is gone. Enemy stats = x you before joiners.")
print("enemy | A: rounds, you left, enemy killed | B: same")
for s in [0.5, 1, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 3, 4, 6]:
    a = fight(*A, s, s); b = fight(*B, s, s)
    print(f"{s:4}  A {a[0]:4d} {a[1]:6.1%} {a[2]:6.1%} | B {b[0]:4d} {b[1]:6.1%} {b[2]:6.1%}")
print("Fight stops at a round cap, enemy 2x: enemy killed and you left, A vs B")
for c in [5, 10, 20, 30, 50, 100]:
    a = fight(*A, 2, 2, cap=c); b = fight(*B, 2, 2, cap=c)
    print(f"{c:4}  killed {a[2]:.1%} vs {b[2]:.1%}  left {a[1]:.1%} vs {b[1]:.1%}")
