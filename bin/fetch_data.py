#!env/bin/python


import os
import logging
import requests
from requests.auth import HTTPBasicAuth
from argparse import ArgumentParser, ArgumentDefaultsHelpFormatter
import hashlib
import json

# set environment parameters so that we use the remote database

def get_database():
    if os.path.isfile('.database_url'):
        with open('.database_url') as f:
            return f.read()
    else:
        cmd = "heroku config:get DATABASE_URL"
        url = subprocess.check_output(cmd, shell=True).strip().decode('ascii')
        with open('.database_url', 'w') as f:
            f.write(url)
            return url

env = os.environ
env["PORT"] = ""
env["ON_CLOUD"] = "1"
env["DATABASE_URL"] = get_database()

from psiturk.models import Participant  # must be imported after setting params

class Anonymizer(object):
    def __init__(self):
        self.mapping = {}

    def __call__(self, uniqueid):
        if ':' in uniqueid:
            worker_id, assignment_id = uniqueid.split(':')
        else:
            worker_id = uniqueid
        if worker_id not in self.mapping:
            self.mapping[worker_id] = 'w' + hashlib.md5(worker_id.encode()).hexdigest()[:7]
        return self.mapping[worker_id]

def pick(obj, keys):
    return {k: obj[k] for k in keys}


def write_data(version, debug):
    anonymize = Anonymizer()

    ps = Participant.query.filter(Participant.codeversion == version).all()
    if not debug:
        ps = [p for p in ps
            if 'debug' not in p.uniqueid
            and not p.workerid.startswith('601055')  # the "preview" participant
        ]
    # Note: we don't filter by completion status.

    metakeys = ['condition', 'counterbalance', 'assignmentId', 'hitId', 'useragent', 'mode', 'status']
    participants = []

    os.makedirs(f'data/raw/{version}/events/', exist_ok=True)
    for p in ps:
        if p.datastring is None:
            continue
        try:
            datastring = json.loads(p.datastring)
        except:
            import IPython, time; IPython.embed(); time.sleep(0.5)
        meta = pick(datastring, metakeys)
        meta['wid'] = anonymize(datastring['workerId'])
        participants.append(meta)

        # datastring['eventdata']
        trialdata = [d['trialdata'] for d in datastring['data']]
        wid = anonymize(p.workerid)

        if version == 'v1.0':
            # remove extraneous data we shouldn't have collected
            trialdata = [d for d in trialdata if not (
                d.get('event', '').startswith('blocks.mouse') or
                d.get('event', '').startswith('blocks.keydown')
            )]

        with open(f'data/raw/{version}/events/{wid}.json', 'w') as f:
            json.dump(trialdata, f)

    with open(f'data/raw/{version}/participants.json', 'w') as f:
        json.dump(participants, f)

    with open(f'data/raw/{version}/identifiers.json', 'w') as f:
        json.dump(anonymize.mapping, f)

    print(len(participants), 'participants')


def main(version, debug):
    write_data(version, debug)
    # reformat(version)

if __name__ == "__main__":
    parser = ArgumentParser(
        formatter_class=ArgumentDefaultsHelpFormatter)
    parser.add_argument(
        "version",
        nargs="?",
        help=("Experiment version. This corresponds to the experiment_code_version "
              "parameter in the psiTurk config.txt file that was used when the "
              "data was collected."))
    parser.add_argument("--debug", help="Keep debug participants", action="store_true")

    args = parser.parse_args()
    version = args.version
    if version == None:
        import configparser
        c = configparser.ConfigParser()
        c.read('config.txt')
        version = c["Task Parameters"]["experiment_code_version"]
        print("Fetching data for current version: ", version)

    main(version, args.debug)
