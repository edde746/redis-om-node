import Globals from './helpers/globals';

import Client from "../lib/client";
import Entity from "../lib/entity/entity";
import Schema from "../lib/schema/schema";
import Search from "../lib/search/search";

const globals: Globals = (globalThis as unknown) as Globals;

interface TestEntity {
  aString: string;
  aNumber: number;
  aBoolean: boolean;
  anArray: string[];
}

class TestEntity extends Entity {}

describe("Search", () => {

  let client: Client;
  let schema: Schema<TestEntity>;
  let search: Search<TestEntity>;

  beforeAll(() => {
    client = globals.client;
    schema = new Schema<TestEntity>(
      TestEntity, {
        aString: { type: 'string' },
        aNumber: { type: 'number' },
        aBoolean: { type: 'boolean' },
        anArray: { type: 'array' }
      });
  })

  describe("#query", () => {
    beforeEach(() => {
      search = new Search<TestEntity>(schema, client);
    });

    it("generates a query matching all items", () => {
      expect(search.query).toBe("*");
    });

    it("throws an exception when invoked with a missing field", () => {
      expect(() => search.where('missingString'))
        .toThrow("The field 'missingString' is not part of the schema.");
    });

    it("generates a query using .where", () => {
      let query = search
        .where('aString').is('foo')
        .where('aNumber').equals(42)
        .where('aBoolean').isTrue().query;
      expect(query).toBe("( ( (@aString:{foo}) (@aNumber:[42 42]) ) (@aBoolean:{1}) )");
    });

    it("generates a query using .andWhere", () => {
      let query = search
        .where('aString').is('foo')
        .andWhere('aNumber').equals(42)
        .andWhere('aBoolean').isTrue().query;
      expect(query).toBe("( ( (@aString:{foo}) (@aNumber:[42 42]) ) (@aBoolean:{1}) )");
    });

    it("generates a query using .orWhere", () => {
      let query = search
        .where('aString').is('foo')
        .orWhere('aNumber').equals(42)
        .orWhere('aBoolean').isTrue().query;
      expect(query).toBe("( ( (@aString:{foo}) | (@aNumber:[42 42]) ) | (@aBoolean:{1}) )");
    });

    it("generates a query using .andWhere and .orWhere", () => {
      let query = search
        .where('aString').is('foo')
        .andWhere('aNumber').equals(42)
        .orWhere('aBoolean').isTrue().query;
      expect(query).toBe("( ( (@aString:{foo}) (@aNumber:[42 42]) ) | (@aBoolean:{1}) )");
    });

    it("generates a query using .andWhere with a function", () => {
      let query = search
        .where('aString').is('foo')
        .andWhere(search => search 
          .where('aString').is('bar')
          .andWhere('aNumber').equals(42)
          .orWhere('aBoolean').isTrue()).query;
      expect(query).toBe("( (@aString:{foo}) ( ( (@aString:{bar}) (@aNumber:[42 42]) ) | (@aBoolean:{1}) ) )")
    });

    it("generates a query using .orWhere with a function", () => {
      let query = search
        .where('aString').is('foo')
        .orWhere(search => search
          .where('aString').is('bar')
          .andWhere('aNumber').equals(42)
          .orWhere('aBoolean').isTrue()).query;
      expect(query).toBe("( (@aString:{foo}) | ( ( (@aString:{bar}) (@aNumber:[42 42]) ) | (@aBoolean:{1}) ) )")
    });

    it("generates a complex query using all the things", () => {
      let query = search
        .where('aString').is('foo')
        .andWhere('aNumber').equals(42)
        .orWhere('aBoolean').isTrue()
        .andWhere(search => search
          .where('aString').is('bar')
          .andWhere('aNumber').equals(23)
          .andWhere('aBoolean').isFalse()
        )
        .orWhere(search => search
          .where('aString').is('baz')
          .orWhere('aNumber').equals(13)
          .orWhere('aBoolean').isTrue()
          .andWhere(search => search
            .where('aString').is('qux')
            .andWhere('aNumber').equals(7)
          )
        ).query;

      expect(query).toBe("( ( ( ( (@aString:{foo}) (@aNumber:[42 42]) ) | (@aBoolean:{1}) ) ( ( (@aString:{bar}) (@aNumber:[23 23]) ) (@aBoolean:{0}) ) ) | ( ( ( (@aString:{baz}) | (@aNumber:[13 13]) ) | (@aBoolean:{1}) ) ( (@aString:{qux}) (@aNumber:[7 7]) ) ) )");
    });
  });
});