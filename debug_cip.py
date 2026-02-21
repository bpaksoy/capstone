import pandas as pd
import os

ipeds_dir = "/Users/banupaksoy/Desktop/capstone/IPEDS_data"
cip_xlsx_path = os.path.join(ipeds_dir, "c2024_a.xlsx")

cip_dict_df = pd.read_excel(cip_xlsx_path, sheet_name='Frequencies')
cip_titles = cip_dict_df[cip_dict_df['VarName'] == 'CIPCODE'].copy()
title_lookup = {str(row['CodeValue']): row['ValueLabel'] for _, row in cip_titles.iterrows()}
for _, row in cip_titles.iterrows():
    try:
        f_val = float(row['CodeValue'])
        title_lookup[f"{f_val:.4g}"] = row['ValueLabel']
        title_lookup[f"{f_val:.1f}"] = row['ValueLabel']
        title_lookup[f"{f_val:.2f}"] = row['ValueLabel']
        title_lookup[f"{f_val:.4f}"] = row['ValueLabel']
    except: pass

cip = '52.1399'
title = title_lookup.get(cip)
if not title:
    try:
        f_cip = float(cip)
        title = title_lookup.get(f"{f_cip:.4g}") or \
                title_lookup.get(f"{f_cip:.1f}") or \
                title_lookup.get(f"{f_cip:.2f}") or \
                title_lookup.get(f"{f_cip:.4f}")
    except: pass

print(f"DEBUG: CIP {cip} -> Title: {title}")

# Check 12.9999 too
cip2 = '12.9999'
title2 = title_lookup.get(cip2)
print(f"DEBUG: CIP {cip2} -> Title: {title2}")

# Check if 52.1399 and 12.9999 keys share any formatted versions
f1 = float(cip)
f2 = float(cip2)
keys1 = {f"{f1:.4g}", f"{f1:.1f}", f"{f1:.2f}", f"{f1:.4f}"}
keys2 = {f"{f2:.4g}", f"{f2:.1f}", f"{f2:.2f}", f"{f2:.4f}"}
print(f"Keys for {cip}: {keys1}")
print(f"Keys for {cip2}: {keys2}")
