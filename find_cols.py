import pandas as pd
import sys

csv_path = '/Users/banupaksoy/Desktop/capstone/College_Scorecard_Raw_Data_03232026/Most-Recent-Cohorts-Institution.csv'
df_cols = pd.read_csv(csv_path, nrows=0).columns.tolist()

targets = ['INSTNM', 'MD_EARN', 'MD_EARN_WNE_4YR', 'EARN', 'LOWER', 'INDICATOR']
found = [col for col in df_cols if any(t in col for t in targets)]

print("Found relevant columns:")
for f in found:
    print(f)
