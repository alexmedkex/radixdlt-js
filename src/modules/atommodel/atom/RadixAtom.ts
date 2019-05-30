import {
    includeJSON,
    includeDSON,
    RadixSerializableObject,
    RadixSpunParticle,
    RadixECSignature,
    RadixSerializer,
    RadixAddress,
    RadixSpin,
    RadixParticle,
    RadixParticleGroup,
} from '..'

import { TSMap } from 'typescript-map'
import { staticNever } from 'rxjs-compat/add/observable/never';

@RadixSerializer.registerClass('ATOM')
export class RadixAtom extends RadixSerializableObject {
    public static METADATA_TIMESTAMP_KEY = 'timestamp'
    public static METADATA_POW_NONCE_KEY = 'powNonce'

    @includeJSON
    @includeDSON
    public particleGroups: RadixParticleGroup[] = []

    @includeJSON
    public signatures: { [id: string]: RadixECSignature }

    @includeDSON
    @includeJSON
    public metaData: {[s: string]: string} = {}

    public getParticles(): RadixSpunParticle[] {
        const particles = []

        for (const particleGroup of this.particleGroups) {
            for (const particle of particleGroup.particles) {
                particles.push(particle)
            }
        }

        return particles
    }

    public getAddresses() {
        const addressMap = new TSMap<RadixAddress, any>()

        for (const particle of this.getParticles()) {
            const addresses = particle.particle.getAddresses()
            for (const address of addresses) {
                addressMap.set(address, '')
            }
        }

        return addressMap.keys()
    }

    public getTimestamp(): number {
        const timestamp = parseInt(this.metaData[RadixAtom.METADATA_TIMESTAMP_KEY], 10)

        if (Number.isNaN(timestamp)) {
            throw new Error('Timestamp is not set or not a valid number')
        } else {
            return timestamp
        }
    }

    public setTimestamp(timestamp: number) {
        this.metaData[RadixAtom.METADATA_TIMESTAMP_KEY] = '' + timestamp
    }

    public setPowNonce(nonce: Long) {
        this.metaData[RadixAtom.METADATA_POW_NONCE_KEY] = nonce.toString()
    }

    public clearPowNonce() {
        delete this.metaData[RadixAtom.METADATA_POW_NONCE_KEY]
    }

    public getSpunParticlesOfType(...types: Array<{ new (...args: any[]): RadixParticle }>) {
        return this.getParticles()
            .filter(s => {
                for (const type of types) {
                    if (s.particle instanceof type) {
                        return true
                    }
                }
            })
    }

    public getParticlesOfSpin(spin: RadixSpin) {
        return this.getParticles()
            .filter(spunParticle => spunParticle.spin === spin)
            .map(spunParticle => spunParticle.particle)
    }

    public getParticlesOfType<T extends RadixParticle>(type: new (...args: any[]) => T, spin?: RadixSpin): T[] {
        let particles = this.getParticles()
            .filter(spunParticle => spunParticle.particle instanceof type)

        if (spin) {
            particles = particles.filter(spunParticle => spunParticle.spin === spin)
        }

        return particles.map(spunParticle => spunParticle.particle) as T[]
    }

    public getFirstParticleOfType<T extends RadixParticle>(type: new (...args: any[]) => T): T {
        return this.getParticles()
            .find(spunParticle => spunParticle.particle instanceof type).particle as T
    }

    public containsParticle(...types: Array<{ new(...args: any[]): RadixParticle }>) {
        for (const spunParticle of this.getParticles()) {
            for (const type of types) {
                if (spunParticle.particle instanceof type) {
                    return true
                }
            }
        }

        return false
    }

    public getParticleGroups() {
        return this.particleGroups
    }
}
