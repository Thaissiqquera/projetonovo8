import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression

# Carrega dados
trans = pd.read_csv('Transa__es_Completas.csv')
camp = pd.read_csv('campanhas.csv')

# Clusters
X = trans[['frequencia_compras','total_gasto','ultima_compra']].copy()
X['dias_desde'] = (pd.to_datetime(X['ultima_compra']) - pd.to_datetime(X['ultima_compra']).min()).dt.days
features = X[['frequencia_compras','total_gasto','dias_desde']]
scaler = StandardScaler().fit(features)
Z = scaler.transform(features)

kmeans = KMeans(n_clusters=4, random_state=42).fit(Z)
pca = PCA(2).fit_transform(Z)

clientes = [{'pca1':float(x1),'pca2':float(x2),'cluster':int(c)} for (x1,x2), c in zip(pca, kmeans.labels_)]
clusters = []
for cid in sorted(set(kmeans.labels_)):
    mask = kmeans.labels_ == cid
    sub = X[mask]
    clusters.append({
        'id': cid,
        'tipo': f"Cluster {cid}",
        'frequencia_media': float(sub['frequencia_compras'].mean()),
        'gasto_total_medio': float(sub['total_gasto'].mean()),
        'dias_ultima_compra': float(sub['dias_desde'].mean()),
        'clientes_count': int(mask.sum())
    })
with open('clusters.json','w',encoding='utf-8') as f:
    json.dump({'clientes':clientes,'clusters':clusters}, f, ensure_ascii=False, indent=2)

# Campanhas
camp['roi'] = (camp['receita'] - camp['custo']) / camp['custo']
campanhas_out = [{'nome': row['nome'], 'roi': float(row['roi']), 'gasto_medio': float(row['total_gasto']/row['clientes'])} for _, row in camp.iterrows()]
with open('campanhas.json','w',encoding='utf-8') as f:
    json.dump({'campanhas':campanhas_out}, f, ensure_ascii=False, indent=2)

# Regressão
y = trans['total_gasto']
Xreg = pd.get_dummies(trans[['campanha','frequencia_compras','renda_mensal']], drop_first=True)
lr = LinearRegression().fit(Xreg, y)
coef = [{'variavel':col, 'coeficiente':float(coef)} for col, coef in zip(Xreg.columns, lr.coef_)]
with open('regressao.json','w',encoding='utf-8') as f:
    json.dump({'coeficientes':coef}, f, ensure_ascii=False, indent=2)

# CLV
clv = trans.groupby('cliente_id')['total_gasto'].sum()
stats = clv.describe().to_dict()
bins = pd.qcut(clv, q=5, duplicates='drop')
dist = clv.groupby(bins).size().reset_index()
dist_out = [{'faixa':str(interval), 'count':int(count)} for interval, count in zip(dist[bins.name], dist[0])]
with open('clv.json','w',encoding='utf-8') as f:
    json.dump({'distribuicao':dist_out,'estatisticas':{k:float(v) for k,v in stats.items()}}, f, ensure_ascii=False, indent=2)
