# Romania Graph Coloring using Prolog

This project implements **Graph Coloring on the Romania Map** using **SWI-Prolog**.  
Users manually select colors for each city using GUI dropdowns, and the program verifies whether the coloring is valid.

---

## 🎨 Features
- 4-color map coloring (Red, Green, Blue, Yellow)
- GUI-based color selection using XPCE
- Validity checking:
  - Ensures no two adjacent cities have the same color
- Visual map rendering of:
  - Cities as colored circles  
  - Edges as connecting lines
- Works on Desktop & Mobile

---

## 🗺 Cities Included
- arad  
- zerind  
- oradea  
- sibiu  
- timisoara  
- fagaras  
- rimnicu_vilcea  
- pitesti  
- bucharest  
- craiova  
- dobreta  

(Full adjacency list and positions included in `graph_coloring.pl`)  
Content source: GraphColoring.pdf fileciteturn1file0

---

## 🧪 Output Examples
### ❌ Invalid Coloring
If adjacent cities have the same color, output shows:
```
? Invalid coloring! Adjacent cities have same color.
```

### ✔ Valid Coloring
```
? Coloring is valid!
```

Sample screenshots are shown in the PDF (page 5–6). fileciteturn1file0

---

## 📱 Mobile Version
A mobile-friendly version is also shown in the PDF (page 7).  
It includes:
- Manual coloring  
- Auto-color button  
- Conflict detection  
fileciteturn1file0

---

## 🖥️ How to Run
1. Install **SWI-Prolog**
2. Load the file:
```
?- ['path/to/graph_coloring.pl'].
```
3. Run:
```
?- run_manual.
```
4. Select colors → Press **OK** → Result is shown.

---

## 📜 License
For educational and academic use only.

