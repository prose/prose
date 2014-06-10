import time
import os
import subprocess
import json

from olark.fab import\
    Application,\
    clouds,\
    task,\
    env,\
    local,\
    run,\
    sudo,\
    put,\
    execute,\
    runs_once

from fabric.context_managers import cd

username = "pronem"

projects = ['prose']

clouds.STAGING = ['pronem@roots1.olark.net']
clouds.PRODUCTION = ['pronem@roots1.olark.net']

PROSE = Application(
    description='prose',
    repos=[
        'prose',
        ],
    )

@runs_once
def deploy_staging():
    """Deploy Prose to staging"""
    execute(PROSE.tasks.install, hosts=clouds.STAGING, parallel=True)
    execute(install_node_packages, hosts=clouds.STAGING, parallel=True)
    execute(reload_prose, hosts=clouds.STAGING, parallel=True)

@runs_once
def deploy():
    """Deploy Prose to PRODUCTION"""
    execute(PROSE.tasks.install, hosts=clouds.PRODUCTION, parallel=True)
    execute(install_node_packages, hosts=clouds.PRODUCTION, parallel=True)
    execute(reload_prose, hosts=clouds.PRODUCTION, parallel=True)

def install_node_packages():
    """Installs the node packages by moving aside node_modules and reinstalling"""
    with cd('/home/pronem/projects/prose'):
        run('make install')
        run('rm -rf node_modules.bak')
        run('mv node_modules node_modules.bak || true')
        run('npm install')

def reload_prose():
    """Restarts the application"""
    run("sudo restart olark-marketing-prose")

@runs_once
def check():
    """Checks local package versions"""
    diff = diff_node_package_versions()
    for line in diff:
        print line
    if diff:
        print "\n\nWARNING!!! packages mismatch\n\n"
    else:
        print "All packages match :)"

def diff_node_package_versions():
    """Diffs npm-shrinkwrap.json against your local npm packages"""
    pipe = subprocess.Popen(["npm", "list", "--json"],
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE,
        )
    stdout, stderr = pipe.communicate()
    current_versions = json.loads(stdout)
    expected_versions = json.load(open("npm-shrinkwrap.json"))
    return __dict_diff(expected_versions, current_versions)

def __dict_diff(d1, d2, parent=''):
    """Recursively diffs two dictionaries and returns a list of differences"""
    # http://stackoverflow.com/questions/4197312/diff-multidimensional-dictionaries-in-python
    changes=[]
    for k in d1.keys():
        newparent = (parent + '.' + k) if parent else k
        if k in d2:
            if type(d1[k]) == type({}):
                changes.extend(__dict_diff(d1[k], d2[k], newparent))
            else:
                if d1[k] != d2[k]:
                    changes.append("CHANGED " + newparent + " (%s != %s)" %  (d1[k], d2[k]))
        else:
            changes.append("MISSING " + newparent)
    return changes
