# Leader = Diego + Ava + Luna, all 3 expedition skills each (kingshotdata.com Gen 7/8 text).
# IDs for Gen 8 skills are NOT published; assumed by matching wording to known IDs.
from itertools import combinations_with_replacement as cwr
from math import prod
H={'Chenko':{'101':25},'Amane':{'102':25},'Ava':{'301':25},'Gordon':{'113':25},
   'Triton':{'112':25},'Howard':{'111':20},'Fahd':{'201':20},'Eric':{'202':20},'Charles':{'202':20},
   'Saul':{'112':10,'113':15},'Hilde':{'102':15,'112':10},'WeeWoo':{'102':15,'101':10},'Thrud':{'102':15,'111':15}}
def run(label,leader):
    def total(t):
        g=dict(leader)
        for h in t:
            for k,v in H[h].items(): g[k]=g.get(k,0)+v
        return prod(1+v/100 for v in g.values())
    b=total([])
    print(f"== {label}")
    print("  single pick:", ", ".join(f"{h} {total([h])/b:.3f}" for h in sorted(H,key=lambda h:-total([h]))))
    for excl in [(),('Thrud',)]:
        pool=[h for h in H if h not in excl]
        r=sorted(cwr(pool,4),key=lambda t:-total(t))[:3]
        print(f"  best 4{' (no Thrud)' if excl else ''}:", " | ".join(f"x{total(t)/b:.3f} {', '.join(t)}" for t in r))
    for t in [('Gordon','Triton','Chenko','Fahd'),('Gordon','Triton','Fahd','Eric'),('Gordon','Triton','Saul','Fahd')]:
        print(f"  x{total(t)/b:.3f} {', '.join(t)}")
base={'101':50,'102':25,'301':25,'112':15,'113':10,
      'X_dmg_chance':25,'X_dmg_taken_up':25,'X_archer':50}  # Diego Piercing EV, Ava Chiaroscuro EV, Luna Arrowflash
run("A: Luna's enemy-attack-down is its own ID", {**base,'X_opp_atk_down':25})
run("B: Luna's enemy-attack-down shares 202 with Eric/Charles", {**base,'202':25})
