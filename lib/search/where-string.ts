import Entity from "../entity/entity";
import Search from "./search";
import WhereField from "./where-field";

export default class WhereString<TEntity extends Entity> extends WhereField<TEntity> {
  private value!: string;

  eq(value: string): Search<TEntity> {
    this.value = value;
    return this.search;
  }

  equal(value: string): Search<TEntity> { return this.eq(value); }
  equals(value: string): Search<TEntity> { return this.eq(value); }
  equalTo(value: string): Search<TEntity> { return this.eq(value); }

  in(value: string[]): Search<TEntity> {
    let search = this.eq(value[0]);
    for (let entry of value.slice(1)) {
      search = search.or(this.field.toString()).eq(entry);
    }
    return search;
  }

  toString(): string {
    let matchPunctuation = /[,.<>{}[\]"':;!@#$%^&*()\-+=~| ]/g;
    let escapedValue = this.value.replace(matchPunctuation, '\\$&');
    return this.buildQuery(`{${escapedValue}}`);
  }
}
