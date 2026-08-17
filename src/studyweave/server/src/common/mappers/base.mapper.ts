export abstract class BaseMapper<TModel, TViewModel> {
  public abstract toViewModel(model: TModel): TViewModel;

  public abstract toModel(viewModel: TViewModel): Partial<TModel>;

  public toResponseList(models: TModel[]): TViewModel[] {
    return models.map((model) => this.toViewModel(model));
  }
}
