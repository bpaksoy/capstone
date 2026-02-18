import os
import pandas as pd
from django.core.management.base import BaseCommand
from collegetracker.models import College, SmartCollege

class Command(BaseCommand):
    help = 'Ingest graduation rate, retention rate, student-faculty ratio, top major, and net price from IPEDS files'

    def handle(self, *args, **options):
        ipeds_dir = "/Users/banupaksoy/Desktop/capstone/IPEDS_data"
        
        # 1. Graduation Rates (GR2024)
        gr_path = os.path.join(ipeds_dir, "gr2024.csv")
        gr_map = {}
        if os.path.exists(gr_path):
            self.stdout.write("Processing Graduation Rates...")
            gr_df = pd.read_csv(gr_path, low_memory=False)
            gr_df['UNITID'] = gr_df['UNITID'].astype(str)
            denom = gr_df[gr_df['GRTYPE'] == 2].set_index('UNITID')['GRTOTLT']
            num = gr_df[gr_df['GRTYPE'] == 3].set_index('UNITID')['GRTOTLT']
            gr_raw = (num / denom).dropna()
            gr_map = gr_raw.to_dict()
            self.stdout.write(f"Calculated {len(gr_map)} graduation rates.")

        # 2. Retention & Ratio (EF2024D)
        efd_path = os.path.join(ipeds_dir, "ef2024d.csv")
        retention_map = {}
        ratio_map = {}
        if os.path.exists(efd_path):
            self.stdout.write("Processing Retention & Ratio...")
            efd_df = pd.read_csv(efd_path, low_memory=False)
            efd_df['UNITID'] = efd_df['UNITID'].astype(str)
            retention_map = efd_df.set_index('UNITID')['RET_PCF'].to_dict()
            ratio_map = efd_df.set_index('UNITID')['STUFACR'].to_dict()
            self.stdout.write(f"Loaded {len(retention_map)} retention rates and {len(ratio_map)} ratios.")

        # 3. Top Major (c2024_a)
        c_path = os.path.join(ipeds_dir, "c2024_a.csv")
        cip_xlsx_path = os.path.join(ipeds_dir, "c2024_a.xlsx")
        top_major_map = {}
        if os.path.exists(c_path) and os.path.exists(cip_xlsx_path):
            self.stdout.write("Calculating Top Majors from completions...")
            c_df = pd.read_csv(c_path, low_memory=False)
            c_df['UNITID'] = c_df['UNITID'].astype(str)
            
            # Convert CIPCODE to numeric for filtering if possible, but keep original for lookup
            c_df['CIP_NUM'] = pd.to_numeric(c_df['CIPCODE'], errors='coerce')
            
            # Filter: 
            # - MAJORNUM=1 (Primary major)
            # - CIPCODE != 99 (Grand total)
            # - AWLEVEL in [3, 5, 7, 9, 17, 18, 19] (Degrees, not just certificates)
            degrees = [3, 5, 7, 9, 17, 18, 19]
            u_majors = c_df[(c_df['MAJORNUM'] == 1) & (c_df['AWLEVEL'].isin(degrees))].copy()
            u_majors = u_majors[u_majors['CIP_NUM'] < 99.0]
            
            # Find max CTOTALT per UNITID
            if not u_majors.empty:
                # Group by UNITID and find the row with max CTOTALT
                top_mj_idx = u_majors.sort_values(['UNITID', 'CTOTALT'], ascending=[True, False]).drop_duplicates('UNITID').index
                top_mj_data = u_majors.loc[top_mj_idx]
                
                # Load titles
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

                for _, row in top_mj_data.iterrows():
                    cip = str(row['CIPCODE'])
                    # Try various lookups
                    title = title_lookup.get(cip)
                    if not title:
                        try:
                            f_cip = float(cip)
                            title = title_lookup.get(f"{f_cip:.4g}") or \
                                    title_lookup.get(f"{f_cip:.1f}") or \
                                    title_lookup.get(f"{f_cip:.2f}") or \
                                    title_lookup.get(f"{f_cip:.4f}")
                        except: pass
                    
                    top_major_map[row['UNITID']] = title or f"Program {cip}"
            
            self.stdout.write(f"Identified {len(top_major_map)} top majors.")

        # 4. Net Price Estimation (drvcost2024 + sfa2324)
        cost_path = os.path.join(ipeds_dir, "drvcost2024.csv")
        sfa_path = os.path.join(ipeds_dir, "sfa2324.csv")
        net_price_map = {}
        if os.path.exists(cost_path) and os.path.exists(sfa_path):
            self.stdout.write("Estimating Average Net Price...")
            cost_df = pd.read_csv(cost_path, low_memory=False)
            sfa_df = pd.read_csv(sfa_path, low_memory=False)
            
            cost_df['UNITID'] = cost_df['UNITID'].astype(str)
            sfa_df['UNITID'] = sfa_df['UNITID'].astype(str)
            
            # Sticker price (In-state living on campus)
            sticker = cost_df.set_index('UNITID')['CINSON']
            # Average grant aid
            avg_grant = sfa_df.set_index('UNITID')['AGRNT_A']
            
            # Net Price = Sticker - Grant
            net_price = sticker - avg_grant
            net_price_map = net_price.dropna().to_dict()
            self.stdout.write(f"Estimated {len(net_price_map)} net prices.")

        # Update Colleges
        colleges = College.objects.all()
        count = 0
        self.stdout.write(f"Updating {colleges.count()} colleges...")
        
        for college in colleges:
            unitid = str(college.UNITID)
            updated = False
            
            # Grad Rate
            if unitid in gr_map:
                val = gr_map[unitid]
                if pd.notnull(val) and val >= 0:
                    college.grad_rate = float(val)
                    updated = True
            
            # Retention
            if unitid in retention_map:
                val = retention_map[unitid]
                if pd.notnull(val) and val >= 0:
                    college.retention_rate = float(val) / 100.0
                    updated = True
            
            # Ratio
            if unitid in ratio_map:
                val = ratio_map[unitid]
                if pd.notnull(val) and val >= 0:
                    college.student_faculty_ratio = int(val)
                    updated = True
            
            # Top Major
            if unitid in top_major_map:
                college.top_major = top_major_map[unitid]
                updated = True

            # Net Price
            if unitid in net_price_map:
                val = net_price_map[unitid]
                if pd.notnull(val) and val > 0:
                    college.avg_net_price = int(val)
                    updated = True
            
            if updated:
                college.save()
                
                # Also update SmartCollege
                SmartCollege.objects.filter(
                    name=college.name, 
                    city=college.city, 
                    state=college.state
                ).update(
                    grad_rate=college.grad_rate,
                    retention_rate=college.retention_rate,
                    student_faculty_ratio=college.student_faculty_ratio,
                    top_major=college.top_major,
                    avg_net_price=college.avg_net_price
                )
                
                count += 1
            
            if count % 1000 == 0 and count > 0:
                self.stdout.write(f"Processed {count} updates...")

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {count} colleges with summary metrics.'))
