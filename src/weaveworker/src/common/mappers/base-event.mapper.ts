export abstract class BaseEventMapper<TModel, TEvent> {
  public abstract toEvent(model: TModel): TEvent;
}
