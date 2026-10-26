# Frakinator simplified kill formula, one troop type, simultaneous rounds.
# kills_on_2 = k*sqrt(N1)*sqrt(N0)*A1/D2 ; N0=min(N1,N2)
from math import sqrt
def fight(A1,D1,A2,D2,N1=100000,N2=100000,k=0.01,cap=10**6):
    r=0
    while N1>0 and N2>0 and r<cap:
        N0=min(N1,N2)
        k2=k*sqrt(N1)*sqrt(N0)*A1/D2; k1=k*sqrt(N2)*sqrt(N0)*A2/D1
        N1,N2=max(N1-k1,0),max(N2-k2,0); r+=1
    return r,round(N1),round(100000-N2)
you=21*21; kr=31*31   # 2000% vs 3000% on every stat
print("case                         rounds  your_left  kraken_killed")
for name,a1,d1,a2 in [("baseline",you,you,kr),
    ("your offense x1.25",you*1.25,you,kr),
    ("your defense x1.25",you,you*1.25,kr),
    ("kraken attack /1.25",you,you,kr/1.25),
    ("kraken attack /1.20",you,you,kr/1.2),
    ("4 fresh codes 1.25^4 (2off,2def)",you*1.5625,you*1.5625,kr),
    ("4 same code (off 2.0)",you*2.0,you,kr)]:
    print(f"{name:32s} {fight(a1,d1,a2,kr)}")
print("marginal value of another 25% in a bucket already holding k x 25%:")
for k in range(4): print(k, round((1+.25*(k+1))/(1+.25*k),3), "vs fresh 20% debuff 1.200")
