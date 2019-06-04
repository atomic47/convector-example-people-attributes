import { join, resolve } from "path";
import { keyStore, identityName, channel, chaincode, networkProfile, identityId, buildParamsWithNewIdentity } from './env';
import * as fs from 'fs';
import { FabricControllerAdapter } from '@worldsibu/convector-adapter-fabric';
import { ClientFactory } from '@worldsibu/convector-core';

import { ParticipantController, Participant } from 'participant-cc';
import { PersonController, Person } from 'person-cc';

export async function refreshAdapter(identity, organizationMSP) {
    const params = buildParamsWithNewIdentity(identity, organizationMSP);
    const adapter = new FabricControllerAdapter({
        txTimeout: 300000,
        user: identity,
        channel,
        chaincode,
        keyStore: resolve(__dirname, params.keyStore),
        networkProfile: resolve(__dirname, params.networkProfile)
        // userMspPath: keyStore
    });
    const initAdapter = adapter.init();
    await initAdapter;

    return {
        ParticipantControllerBackEnd: ClientFactory(ParticipantController, adapter),
        PersonControllerBackEnd: ClientFactory(PersonController, adapter)
    };
}
const adapter = new FabricControllerAdapter({
    txTimeout: 300000,
    user: identityName,
    channel,
    chaincode,
    keyStore: resolve(__dirname, keyStore),
    networkProfile: resolve(__dirname, networkProfile)
    // userMspPath: keyStore
});

export const initAdapter = adapter.init();
export const ParticipantControllerBackEnd = ClientFactory(ParticipantController, adapter);
export const PersonControllerBackEnd = ClientFactory(PersonController, adapter);

//#region Optional

/**
 * Check if the identity has been initialized in the chaincode.
 */
export async function InitServerIdentity() {
    await initAdapter;

    const res = await ParticipantControllerBackEnd.get(identityId);
    try {
        const serverIdentity = new Participant(res).toJSON();

        if (!serverIdentity || !serverIdentity.id) {
            throw new Error('Server identity does not exists, make sure to enroll it or seed data');
        } else {
            console.log('Server identity exists');
        }
    } catch (ex) {
        console.log(JSON.stringify(ex));
        throw new Error('Server identity does not exists, make sure to enroll it or seed data');
    }
}


const contextPath = join(resolve(__dirname, keyStore) + '/' + identityName);
fs.readFile(contextPath, 'utf8', async function (err, data) {
    if (err) {
        throw new Error(`Context in ${contextPath} doesn't exist. Make sure that path resolves to your key stores folder`);
    } else {
        console.log(`Context path with cryptographic materials exists in ${contextPath}`);
    }
});

//#endregion
