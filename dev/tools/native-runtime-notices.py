"""Render license metadata from the resolved Android runtime graph and cached upstream POMs.
Usage: python3 dev/tools/native-runtime-notices.py GRADLE_INVENTORY_LOG GRADLE_CACHE
"""
import json,sys,hashlib,xml.etree.ElementTree as ET
from pathlib import Path
root=Path(__file__).resolve().parents[2]
line=next(line for line in Path(sys.argv[1]).read_text().splitlines() if line.startswith('NATIVE_DEP_JSON='))
entries=json.loads(line.split('=',1)[1]);cache=Path(sys.argv[2])/'caches/modules-2/files-2.1';lines=['Soul of Meal Android beta — resolved native runtime dependencies','License names/URLs below are upstream Maven POM declarations. Capacitor/npm notices are in THIRD_PARTY_LICENSES.txt.','Publisher must review proprietary SDK terms before store publication.',''];missing=[]
def license_chain(group,name,version,depth=0):
 poms=list((cache/group/name/version).glob('*/*.pom'))
 if not poms or depth>6:return [],[]
 p=poms[0];xml=ET.fromstring(p.read_text());licenses=[{'name':license.findtext('{*}name',''),'url':license.findtext('{*}url','')} for license in xml.findall('.//{*}licenses/{*}license')]
 evidence=[{'pom':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}]
 parent=xml.find('{*}parent')
 if not licenses and parent is not None:
  inherited,chain=license_chain(parent.findtext('{*}groupId'),parent.findtext('{*}artifactId'),parent.findtext('{*}version'),depth+1);licenses=inherited;evidence+=chain
 return licenses,evidence
for entry in entries:
 licenses,evidence=license_chain(entry['group'],entry['name'],entry['version']);entry['pomEvidence']=evidence
 entry['licenses']=licenses
 if not licenses:missing.append(':'.join(entry[k] for k in ['group','name','version']))
 lines.append(':'.join(entry[k] for k in ['group','name','version']))
 lines.extend('  '+license['name']+' — '+license['url'] for license in licenses)
 if not licenses:lines.append('  License metadata absent in cached POM; retained for manual review.')
report={'source':'Gradle debugRuntimeClasspath resolution graph; upstream cached POM license metadata, SHA256 recorded','entries':entries,'missingLicenseMetadata':missing}
(root/'dev/docs/major-v400/native-runtime-dependencies.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
lines.extend(['','Apache License 2.0 (full text; AndroidX/Kotlin/Gson and Apache-labelled dependencies)','', (root/'node_modules/typescript/LICENSE.txt').read_text()])
(root/'public/legal/NATIVE_SDK_NOTICES.txt').write_text('\n'.join(lines)+'\n');print({'runtimeModules':len(entries),'missingLicenseMetadata':missing})
