# Frakinator simplified formula (same as tools/kill_sim.py): kills on side 2 = k*sqrt(N1)*sqrt(min(N1,N2))*A1/D2
# Equal stats. k sets the pace (about 1% per round at the start). Stops when a side falls under 1% of its start.
from math import sqrt
def fight(N1,N2,A1=1,D1=1,A2=1,D2=1,k=0.01,cap=5000):
    s1,s2=N1,N2; r=0; first=None
    while N1>0.01*s1 and N2>0.01*s2 and r<cap:
        N0=min(N1,N2); k2=k*sqrt(N1)*sqrt(N0)*A1/D2; k1=k*sqrt(N2)*sqrt(N0)*A2/D1
        if r==0: first=(k2,k1)
        N1,N2=max(N1-k1,0),max(N2-k2,0); r+=1
    return r,N1,N2,first
D=2_000_000
for O in (2_000_000,1_800_000,1_500_000):
    r,o,d,(dealt,taken)=fight(O,D)
    print(f"offense {O/1e6:.1f}M vs 2.0M | round 1: offense kills {dealt:,.0f}, loses {taken:,.0f} | after {r} rounds: offense {o:,.0f} ({o/O:.0%}), defense {d:,.0f} ({d/D:.0%})")
for O in (1_800_000,1_500_000):
    lo,hi=1.0,2.0
    for _ in range(30):
        m=(lo+hi)/2; r,o,d,_=fight(O,D,A1=m,D1=m)
        if o/O < d/D: lo=m
        else: hi=m
    print(f"  {O/1e6:.1f}M side needs x{m:.3f} on offense AND on defense to end even (x{m*m:.2f} total)")
