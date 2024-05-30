from PIL import Image, UnidentifiedImageError
from pathlib import Path
import sys, os, argparse, re, time, signal, threading, json

disc = [
	[
		"protanopia","PRA"
	],
	[
		"protanomaly","PRY"
	],
	[
		"deuteranopia","DEA"
	],
	[
		"deuteranomaly","DEY"
	],
	[
		"tritanopia","TRA"
	],
	[
		"tritanomaly","TRY"
	],
	[
		"achromatopsia","ACA"
	],
	[
		"all dyschromatopsias","ALL"
	]
]

class DyProcessor:
	
	powGammaLookup = [0.0]*256
	COLOR_MATRIX = {
		"Normal": { "R": [100, 0, 0], "G": [0, 100, 0], "B": [0, 0, 100] },
		"Protanopia": { "R": [56.667, 43.333, 0], "G": [55.833, 44.167, 0], "B": [0, 24.167, 75.833] },
		"Protanomaly": { "R": [81.667, 18.333, 0], "G": [33.333, 66.667, 0], "B": [0, 12.5, 87.5] },
		"Deuteranopia": { "R": [62.5, 37.5, 0], "G": [70, 30, 0], "B": [0, 30, 70] },
		"Deuteranomaly": { "R": [80, 20, 0], "G": [25.833, 74.167, 0], "B": [0, 14.167, 85.833] },
		"Tritanopia": { "R": [95, 5, 0], "G": [0, 43.333, 56.667], "B": [0, 47.5, 52.5] },
		"Tritanomaly": { "R": [96.667, 3.333, 0], "G": [0, 73.333, 26.667], "B": [0, 18.333, 81.667] },
		"Achromatopsia": { "R": [29.9, 58.7, 11.4], "G": [29.9, 58.7, 11.4], "B": [29.9, 58.7, 11.4] },
		"Achromatomaly": { "R": [61.8, 32, 6.2], "G": [16.3, 77.5, 6.2], "B": [16.3, 32, 51.6] }
	}
	
	RBLIND = { 
		"protan": { "cpu": 0.735, "cpv": 0.265, "am": 1.273463, "ayi": -0.073894 }, 
		"deutan": { "cpu": 1.14, "cpv": -0.14, "am": 0.968437, "ayi": 0.003331 }, 
		"tritan": { "cpu": 0.171, "cpv": -0.003, "am": 0.062921, "ayi": 0.292119 } }
		
	def __init__(self):
		p = 0
		while p < 256:
			self.powGammaLookup[p] = pow(p / 255, 2.2)
			p+=1
			
	def loadImage(self,img):
		self.img = img
		self.mono = False
		self.anomaly = False
		self.acromy = ""
		self.pixelMap = self.img.load()
		self.trasparent = False
		if len(self.pixelMap[0,0]) > 3:
			self.trasparent = True
		
	def processImage(self,disc: int):
		if(disc == 0):
			self.acromy = "protan"
		elif(disc == 1):
			self.acromy = "protan"
			self.anomaly = True
		elif(disc == 2):
			self.acromy = "deutan"
		elif(disc == 3):
			self.acromy = "deutan"
			self.anomaly = True
		elif(disc == 4):
			self.acromy = "tritan"
		elif(disc == 5):
			self.acromy = "tritan"
			self.anomaly = True
		elif(disc == 6):
			self.mono = True
		else:
			sys.exit("error: DyProcessor error: the value must be between 0 and 6")
		
		for i in range(self.img.size[0]):
			for j in range(self.img.size[1]):
				red = self.pixelMap[i,j][0]
				gre = self.pixelMap[i,j][1]
				blu = self.pixelMap[i,j][2]
				if self.trasparent:
					tra = self.pixelMap[i,j][3]
				
				if(self.mono):
					red,gre,blu = self.__monochrome([red,gre,blu])
				else:
					if(self.anomaly):
						red,gre,blu = self.__anomylize([red,gre,blu], self.__blindMK(red,gre,blu,self.RBLIND[self.acromy]))
					else:
						red,gre,blu = self.__blindMK(red,gre,blu,self.RBLIND[self.acromy])
				red = int(red)
				gre = int(gre)
				blu = int(blu)
				
				if self.trasparent:
					self.pixelMap[i,j] = (red,gre,blu,tra)
				else:
					self.pixelMap[i,j] = (red,gre,blu)
		return self.img
	
	def __inversePow(self,n):
		return 255 * (0 if n <= 0 else (1 if n >= 1 else pow(n, 1 / 2.2)))
		
	def __matrixFunction(self,r,g,b,matrix):
		return (r * matrix["R"][0]) / 100 + (g * matrix["R"][1]) / 100 + (b * matrix["R"][2]) / 100, (r* matrix["G"][0]) / 100 + (g * matrix["G"][1]) / 100 + (b * matrix["G"][2]) / 100, (r * matrix["B"][0]) / 100 + (g * matrix["B"][1]) / 100 + (b * matrix["B"][2]) / 100
		
	def __anomylize(self,a, b):
		c = 1.75
		d = 1 * c + 1
		return [(c * b[0] + 1 * a[0]) / d, (c * b[1] + 1 * a[1]) / d, (c * b[2] + 1 * a[2]) / d]
	
	def __monochrome(self,a):
		b = int(0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2])
		return [b, b, b]
		
	
	
	def __blindMK(self,r,g,b,blind):
		wx = 0.312713
		wy = 0.329016
		wz = 0.358271
		
		cr = self.powGammaLookup[int(r)]
		cg = self.powGammaLookup[int(g)]
		cb = self.powGammaLookup[int(b)]

		cx = 0.430574 * cr + 0.34155 * cg + 0.178325 * cb
		cy = 0.222015 * cr + 0.706655 * cg + 0.07133 * cb
		cz = 0.020183 * cr + 0.129553 * cg + 0.93918 * cb
		
		sum_xyz = cx + cy + cz
		cu = 0
		cv = 0
		
		if sum_xyz != 0:
			cu = cx / sum_xyz
			cv = cy / sum_xyz
		
		nx = (wx * cy) / wy
		nz = (wz * cy) / wy
		dy = 0
		
		if cu < blind["cpu"]:
			clm = (blind["cpv"] - cv) / (blind["cpu"] - cu)
		else:
			clm = (cv - blind["cpv"]) / (cu - blind["cpu"])
		
		clyi = cv - cu * clm
		du = (blind["ayi"] - clyi) / (clm - blind["am"])
		dv = clm * du + clyi
		
		sx = (du * cy) / dv
		sy = cy
		sz = ((1 - (du + dv)) * cy) / dv
		
		sr = 3.063218 * sx - 1.393325 * sy - 0.475802 * sz
		sg = -0.969243 * sx + 1.875966 * sy + 0.041555 * sz
		sb = 0.067871 * sx - 0.228834 * sy + 1.069251 * sz
		
		dx = nx - sx
		dz = nz - sz
		
		dr = 3.063218 * dx - 1.393325 * dy - 0.475802 * dz
		dg = -0.969243 * dx + 1.875966 * dy + 0.041555 * dz
		db = 0.067871 * dx - 0.228834 * dy + 1.069251 * dz
		
		#forse controllare se sX non è 0
		adjr = ((0 if sr < 0 else 1) - sr) / dr if dr else 0
		adjg = ((0 if sg < 0 else 1) - sg) / dg if dr else 0
		adjb = ((0 if sb < 0 else 1) - sb) / db if dr else 0
			
		adjust = max( 
			0 if adjr < 0 or adjr > 1 else adjr,
			0 if adjg > 1 or adjg < 0 else adjg,
			0 if adjb > 1 or adjb < 0 else adjb)
		
		#K = 0
		sr += adjust * dr
		sg += adjust * dg
		sb += adjust * db
		
		return self.__inversePow(sr), self.__inversePow(sg), self.__inversePow(sb)


