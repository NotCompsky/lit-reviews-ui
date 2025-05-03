#!/usr/bin/env python3


import os
from PIL import Image
import subprocess
import json
import re
import shutil


def standardise_tag(tag:str):
	'''if tag in (
		"britain","england","scotland","wales",
		"china",
		"france",
		"germany",
		"iceland",
	):
		tag = tag[0].upper() + tag[1:]'''
	return tag


def md2html(path_to_md2html:str, tmp_fp:str, s:str):
	with open(tmp_fp, "w") as f:
		f.write(s)
	
	subprocess.run([path_to_md2html,"-w",tmp_fp,tmp_fp]) # Don't worry, it reads completely before any writes occur, so we can write to the input file without anything bad happening
	
	with open(tmp_fp, "r") as f:
		return f.read().strip()


def process_tag_heirarchy_str(s:str, tag2parents:dict):
	parents:list = [None,None,None,None,None,None,None,None,None,None]
	for line in s.split("\n"):
		if len(line) == 0:
			continue;
		n_tabs:int = 0;
		while line[n_tabs] == "\t":
			n_tabs += 1
		tagname:str = line[n_tabs:]
		
		ls:list = tag2parents.get(tagname)
		if ls is None:
			ls = []
		i:int = n_tabs-1
		while i >= 0:
			if parents[i] not in ls:
				ls.append(parents[i])
				for grandparent_tag in tag2parents[parents[i]]:
					if grandparent_tag not in ls:
						ls.append(grandparent_tag)
			i -= 1
		tag2parents[tagname] = ls
		
		parents[n_tabs] = tagname


def obey_exif(img):
	# src: https://gist.github.com/benob/2cc6ea1394dee1b49aa465fe9e1d9400
	exif = img.getexif()
	ORIENTATION:int = 274
	if exif is not None and ORIENTATION in exif:
		orientation = exif[ORIENTATION]
		method = {2: Image.FLIP_LEFT_RIGHT, 4: Image.FLIP_TOP_BOTTOM, 8: Image.ROTATE_90, 3: Image.ROTATE_180, 6: Image.ROTATE_270, 5: Image.TRANSPOSE, 7: Image.TRANSVERSE}
		if orientation in method:
			img = img.transpose(method[orientation])
	return img


def process_dir(md_filepaths_to_content_prefixes:dict, musicdir:str, tags_for_all:list, rootdir:str, relativedirpath:str, dirroots:list, dstdir:str, path_to_md2html:str, literature_metadata:list, imgindx:int, origfp2thumbfp:dict, empty_thumb_url:str, tag2parents:dict):
	tmp_fp:str = dstdir + "/tmp_md2html.html"
	for fname in sorted(os.listdir(srcdir)): # "1923" comes before "1923.md"
		fp:str = srcdir + "/" + fname
		if fname.endswith(".md"):
			stem:str = fname[:-3]
			
			coverimg_fp:str = origfp2thumbfp["stem2thumb"].get(fp)
			if coverimg_fp is None:
				for dirroot in dirroots:
					dirpath:str = dirroot + stem
					cover_fp:str = None
					if os.path.exists(dirpath+".cover.url"):
						cover_fp = dirpath+".cover.url"
					if os.path.exists(dirpath+".cover.jpg"):
						cover_fp = dirpath+".cover.jpg"
					elif os.path.exists(dirpath+".cover.webp"):
						cover_fp = dirpath+".cover.webp"
					elif os.path.exists(dirpath+".cover.png"):
						cover_fp = dirpath+".cover.png"
					elif os.path.exists(dirpath+".cover.avif"):
						pass # PIL doesn't work on this yet: cover_fp = dirpath+".cover.avif"
					elif os.path.isdir(dirpath):
						cover_fp:str = None
						for prefix in ("_","__",""):
							for postfix1 in ("1","","A","a"):
								for postfix2 in (".jpg",".webp",".png",".avif"):
									_fp:str = dirpath + "/" + prefix+"cover"+postfix1+postfix2
									if os.path.exists(_fp):
										cover_fp = _fp
										break
								if cover_fp is not None:
									break
							if cover_fp is not None:
								break
					
					if cover_fp is None:
						pass
					elif cover_fp.endswith(".url"):
						with open(cover_fp) as f:
							coverimg_fp = f.read()
					else:
						imgindx += 1
						imgoutname:str = str(imgindx) + ".jpg"
						with Image.open(cover_fp) as img:
							orig_w, orig_h = img.size
							new_h:int = int(200.0*orig_h/orig_w)
							new_img = img.resize((200,new_h), Image.Resampling.LANCZOS).convert("RGB")
							
							if new_h > 300:
								offset:int = (new_h-300)>>1
								new_img = new_img.crop((0,offset,200,300+offset))
							
							obey_exif(new_img).save(dstdir + "/" + imgoutname)
						coverimg_fp = imgoutname
						origfp2thumbfp["stem2thumb"][fp] = coverimg_fp
						break
			
			if coverimg_fp is None:
				coverimg_fp = empty_thumb_url
			
			if True:
				metadata_d:dict = {}
				htmlcontent:str = None
				
				with open(fp, "r") as f:
					s:str = f.read()
					
					offset1:int = 0
					for varname in ("title","authors","tags","stars","music","url"):
						offset2:int = s.index("\n", offset1)
						metadata_d[varname] = s[offset1:offset2]
						offset1 = offset2+1
					metadata_d["title"], metadata_d["subtitle"] = re.search("^([^:]+)(?:: (.*))?$", metadata_d["title"]).groups()
					metadata_d["authors"] = re.split("; *", metadata_d["authors"])
					metadata_d["tags"]  = [standardise_tag(x) for x in re.split(", *", metadata_d["tags"]) if x!=""]
					all_ancestor_tags:list = []
					for tagname in metadata_d["tags"]:
						all_ancestor_tags += tag2parents.get(tagname,[])
					for tagname in tags_for_all:
						# print(tagname + " in " + str(all_ancestor_tags) + "?", tagname in all_ancestor_tags)
						if tagname not in all_ancestor_tags:
							metadata_d["tags"].append(tagname)
					
					m = re.search("^(?:([?])|([0-9]+(?:[.][0-9]+)?)) stars?$", metadata_d["stars"])
					if m.group(1) == "?":
						metadata_d["stars"] = -1.0
					else:
						metadata_d["stars"] = float(m.group(2))
					
					if metadata_d["url"] == "url=":
						metadata_d["url"] = None
					else:
						metadata_d["url"] = metadata_d["url"][4:]
					
					music_url:str = metadata_d["music"]
					if music_url == "music=":
						metadata_d["music"] = None
					else:
						music_url = re.sub(" #.*", "", music_url[6:])
						metadata_d["music"] = music_url
						if not music_url.startswith("http"):
							full_music_fp:str = music_url
							if music_url.startswith("/"):
								music_url = os.path.basename(music_url)
							elif musicdir is None:
								raise ValueError("Config file does not specify audio_root_directory, but audio path is relative: " + music_url)
							else:
								full_music_fp = musicdir+"/"+music_url
							
							dst_music_fp:str = dstdir + "/" + music_url
							
							stat1 = os.stat(full_music_fp)
							stat2 = os.stat(dst_music_fp)
							
							if stat1.st_size != stat2.st_size:
								shutil.copy(full_music_fp, dst_music_fp)
					
					markdown_src:str = s[offset1:]
					markdown_src = re.sub("([?]|[12][0-9]{3}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{2} [A-Za-z][a-z]+ [12][0-9]{3}|[12][0-9]{3} [A-Za-z][a-z]+ [0-9]{2}|[0-9]{2}[-/][0-9]{2}[-/][12][0-9]{3})\n(?:(.*)\n)?(https?://[^ ]+)(?: +#.*)\n((?:.\n?)+)(?:\n\n|\n?$)", process_oirjgoirioerre, markdown_src)
					
					htmlcontent = md2html(path_to_md2html, tmp_fp, markdown_src)
					
					relativefilepath:str = relativedirpath + "/" + fname
					if relativefilepath in md_filepaths_to_content_prefixes:
						htmlcontent = md_filepaths_to_content_prefixes[relativefilepath] + htmlcontent
				
				metadata:list = [metadata_d["title"], metadata_d["subtitle"], metadata_d["authors"], metadata_d["tags"], metadata_d["stars"], coverimg_fp, htmlcontent, metadata_d["url"], metadata_d["music"]]
				
				literature_metadata.append(metadata)
			else:
				print("WARNING: Review has no cover image, so is skipped: " + stem)
	if os.path.isfile(tmp_fp):
		os.remove(tmp_fp)
	
	return imgindx


if __name__ == "__main__":
	import argparse
	import json
	import yaml
	
	parser = argparse.ArgumentParser()
	parser.add_argument("--md2html-path", default="md_to_html")
	parser.add_argument("--srcdir", default=".")
	parser.add_argument("dstdir")
	args = parser.parse_args()
	
	origfp2thumbfp_fp:str = args.srcdir+"/origfp2thumbfp.json"
	
	thisdir:str = os.path.dirname(__file__)
	
	origfp2thumbfp:dict = None
	try:
		with open(origfp2thumbfp_fp, "r") as f:
			origfp2thumbfp = json.load(f)
	except FileNotFoundError:
		origfp2thumbfp = {"imgindx":0, "stem2thumb":{}}
	
	literature_metadata:list = []
	imgindx:int = origfp2thumbfp["imgindx"]
	empty_thumb_url:str = "finger.png"
	
	config:dict = None
	with open(args.srcdir+"/config.yaml", "r") as f3:
		config = yaml.safe_load(f3.read())
	
	screeds:dict = {}
	for key, val in config["main_tag_descriptions"].items():
		screeds[key] = md2html(args.md2html_path, args.dstdir + "/tmp_md2html.html", val)
	
	md_filepaths_to_content_prefixes:dict = {}
	md_filepaths_to_content_prefixes_json:str = config.get("md_filepaths_to_content_prefixes_json")
	if md_filepaths_to_content_prefixes_json is not None:
		with open(md_filepaths_to_content_prefixes_json, "r") as f:
			md_filepaths_to_content_prefixes = json.load(f)
	
	tag2parents:dict = {}
	TAG_HEIRARCHY_STR:str = ""
	try:
		with open(args.srcdir+"/tag-heirarchy.txt", "r") as f:
			TAG_HEIRARCHY_STR = f.read()
	except FileNotFoundError:
		pass
	if TAG_HEIRARCHY_STR != "":
		process_tag_heirarchy_str(TAG_HEIRARCHY_STR, tag2parents)
	
	audio_root_directory:str = config["audio_root_directory"]
	if not audio_root_directory.startswith("/"):
		audio_root_directory = args.srcdir + "/" + audio_root_directory
	
	ALL_CATEGORY_TAGS:list = []
	for tagname in screeds:
		if tagname not in ALL_CATEGORY_TAGS:
			ALL_CATEGORY_TAGS.append(tagname)
		if os.path.isdir(args.srcdir+"/"+tagname):
			imgindx = process_dir(md_filepaths_to_content_prefixes, audio_root_directory, [tagname], args.srcdir, tagname, [
				args.srcdir+"/"+tagname+"/"
			], args.dstdir, args.md2html_path, literature_metadata, imgindx, origfp2thumbfp, empty_thumb_url, tag2parents)
	
	if os.path.isdir(args.srcdir+"/all"):
		imgindx = process_dir(md_filepaths_to_content_prefixes, audio_root_directory, [], args.srcdir, "all", [
			args.srcdir+"/all/"
		], args.dstdir, args.md2html_path, literature_metadata, imgindx, origfp2thumbfp, empty_thumb_url, tag2parents)
	
	origfp2thumbfp["imgindx"] = imgindx
	
	with open(origfp2thumbfp_fp, "w") as f:
		json.dump(origfp2thumbfp, f)
	
	js_contents:str = None
	css_contents:str = None
	with open(thisdir+"/lit-reviews.js", "r") as f1:
		js_contents = re.sub('^const data = .*;\n','const data = DATADUMPHERE\n', f1.read())
		if "DATADUMPHERE" not in js_contents:
			raise ValueError("'DATADUMPHERE' not in contents: " + js_contents)
		else:
			js_contents = js_contents.replace("DATADUMPHERE",json.dumps({"screeds":screeds,"reviews":sorted(literature_metadata,key=lambda x:x[4],reverse=True)}))
			js_contents = js_contents.replace("TAG_HEIRARCHY_STR", TAG_HEIRARCHY_STR)
			js_contents = js_contents.replace("ALL_CATEGORY_TAGS", json.dumps(ALL_CATEGORY_TAGS)[1:-1])
			js_contents = js_contents.replace("FIRST_MAIN_TAG_TO_DISPLAY",json.dumps(config["initial_checked"] or ""))
	with open(thisdir+"/lit-reviews.css", "r") as f1:
		css_contents = f1.read()
	with open(args.dstdir + "/index.html", "w") as f2:
		with open(thisdir+"/lit-reviews.html", "r") as f1:
			content:str = f1.read()
			
			content = content.replace("HTMLTITLEHERE",config["title"])
			content = content.replace("HTML_HEAD_POSTFIX_STUFF",config.get("html_head_postfix_stuff",""))
			content = content.replace("HTML_BODY_PREFIX_STUFF",config.get("html_body_prefix_stuff",""))
			content = content.replace("HTML_BODY_POSTFIX_STUFF",config.get("html_body_postfix_stuff",""))
			
			display_subgroups_html:str = ""
			for group in config["display_groups"]:
				display_subgroups_html += '<div class="display_subgroup">'
				for tagname, tagtitle in group:
					maybechecked:str = " checked" if (tagname==config["initial_checked"]) else ""
					display_subgroups_html += f'<label><input type="radio" autocomplete="off" class="displayonlyradiobtn" name="displayonly" data-x="{tagname}"{maybechecked}/> {tagtitle}</label><br>'
				display_subgroups_html += '</div>'
			
			content = content.replace('DISPLAY_SUBGROUPS_HERE', display_subgroups_html)
			#content = content.replace('<link rel="stylesheet" href="books.css"/>', '<style>'+css_contents+'</style>')
			#content = content.replace('<script src="books.js"></script>', '<script>'+js_contents+'</script>')
			f2.write(content)
	with open(args.dstdir + "/books.css", "w") as f2:
		f2.write(css_contents)
	with open(args.dstdir + "/books.js", "w") as f2:
		f2.write(js_contents)